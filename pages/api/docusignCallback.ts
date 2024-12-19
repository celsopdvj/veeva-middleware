import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateVeeva, getVaultInfo } from "./common/functions";
import docusign from "docusign-esign";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const bodyData = req.body.data.envelopeSummary;

  if (
    !bodyData?.customFields?.textCustomFields?.find(
      (p: any) => p.name == "docId"
    )
  ) {
    res.status(200).json({
      success: true,
      data: "Not a Veeva integration document",
    });
    return;
  }

  const customFields: any[] = bodyData.customFields.textCustomFields;
  const envelopeId = req.body.data.envelopeId;

  const docId = customFields.find((p) => p.name == "docId").value;
  const vaultId = customFields.find((p) => p.name == "vaultId").value;
  const majorVersion = customFields.find((p) => p.name == "majorVersion").value;
  const minorVersion = customFields.find((p) => p.name == "minorVersion").value;
  const completedAt = bodyData.completedDateTime;

  const { success, vault, data } = await getVaultInfo(vaultId as string);

  if (!success) {
    res.status(200).json({
      success,
      data,
    });
    return;
  }

  const veevaAuth = await authenticateVeeva(
    vault.dns,
    vault.username,
    vault.password
  );

  if (!veevaAuth.success) {
    res.status(200).json(veevaAuth.data);
    return;
  }

  const sessionId = veevaAuth.data.sessionId;

  const event = req.body.event;
  let updateDocumentQuery = `signatures_completed__c=true&completed_date__c=${completedAt}&signature_status__c=Completed`;
  let updateStatus = "complete_signature__c";
  let wasCompleted = true;

  if (event == "envelope-voided") {
    updateDocumentQuery = `envelope_id__c=null&signature_status__c=Envelope Voided&signature_request_sent__c=false`;
    updateStatus = "cancel_signature__c";
    wasCompleted = false;
  }

  if (event == "envelope-declined") {
    updateDocumentQuery = `envelope_id__c=null&signature_status__c=Envelope Declined&signature_request_sent__c=false`;
    updateStatus = "cancel_signature__c";
    wasCompleted = false;
  }

  const updateDocData = await updateDocumentData(
    vault.dns,
    sessionId,
    docId,
    `signatures_completed__c=true&completed_date__c=${completedAt}&signature_status__c=Completed`
  );

  if (!updateDocData.success) {
    res.status(200).json(updateDocData.data);
    return;
  }

  const updateDocStatus = await updateDocumentStatus(
    vault.dns,
    sessionId,
    docId,
    majorVersion,
    minorVersion,
    updateStatus
  );

  if (!wasCompleted) {
    res.status(200).json(updateDocStatus.data);
    return;
  }

  const docusignAuthReq = await fetch(
    `${process.env.APP_URL}/api/authDocusign?sessionId=${sessionId}&vaultUrl=${vault.dns}&email=`
  );

  const docusignAuth = await docusignAuthReq.json();

  await uploadSignedDocuments(
    docusignAuth.data.basePath,
    docusignAuth.data.accessToken,
    docusignAuth.data.apiAccountId,
    envelopeId,
    vault.dns,
    docId,
    sessionId
  );

  res.status(200).json(updateDocStatus.data);
}

const updateDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  updateString: string
) => {
  try {
    await fetch(`${vaultUrl}/objects/documents/${documentId}`, {
      headers: {
        Authorization: sessionId,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PUT",
      body: updateString,
    }).then((r) => r.json());

    return {
      success: true,
      data: "Document Updated",
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

const updateDocumentStatus = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  majorVersion: string,
  minorVersion: string,
  action: string
) => {
  try {
    await fetch(
      `${vaultUrl}/objects/documents/${documentId}/versions/${majorVersion}/${minorVersion}/lifecycle_actions/${action}`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "PUT",
      }
    ).then((r) => r.json());

    return {
      success: true,
      data: "Document State Updated",
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

const uploadSignedDocuments = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  envelopeId: string,
  vaultUrl: string,
  veevaDocId: string,
  sessionId: string
) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  const envelopeDocumentsResponse = await envelopesApi.listDocuments(
    accountId,
    envelopeId
  );
  let envelopeDocuments = envelopeDocumentsResponse.envelopeDocuments;

  if (envelopeDocuments) {
    for (const i in envelopeDocuments) {
      const documentId = envelopeDocuments[i].documentId;

      const document = await envelopesApi.getDocument(
        accountId,
        envelopeId,
        documentId ?? "",
        {}
      );

      if (documentId === "certificate") {
        await createDocumentAttachment(
          sessionId,
          "DocuSign Certificate.pdf",
          document,
          veevaDocId,
          vaultUrl
        );
      } else {
        await createDocumentRendition(
          sessionId,
          "DocuSign Rendition.pdf",
          document,
          veevaDocId,
          vaultUrl
        );
      }
    }
  }
};

const createDocumentAttachment = async (
  sessionId: string,
  fileName: any,
  fileContent: string,
  docId: string,
  vaultUrl: string
) => {
  const myBlob = new Blob([fileContent]);
  const formData = new FormData();
  formData.append("file", myBlob, fileName);

  const response = await fetch(
    `${vaultUrl}/objects/documents/${docId}/attachments`,
    {
      headers: {
        Authorization: sessionId,
        Accept: "*/*",
      },
      method: "POST",
      body: formData,
    }
  ).then((r) => r.json());

  return response;
};

const createDocumentRendition = async (
  sessionId: string,
  fileName: any,
  fileContent: string,
  docId: string,
  vaultUrl: string
) => {
  const myBlob = new Blob([fileContent]);
  const formData = new FormData();
  formData.append("file", myBlob, fileName);

  const response = await fetch(
    `${vaultUrl}/objects/documents/${docId}/renditions/docusign_rendition__c`,
    {
      headers: {
        Authorization: sessionId,
        Accept: "*/*",
      },
      method: "POST",
      body: formData,
    }
  ).then((r) => r.json());

  return response;
};
