import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateVeeva } from "./common/functions";
import docusign from "docusign-esign";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = "docusign_integration@partnersi-usdm.com";
  const password = "Vault2024!";

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const bodyData = req.body.data.envelopeSummary;
  const customFields: any[] = bodyData.customFields.textCustomFields;
  const envelopeId = req.body.data.envelopeId;
  const docId = customFields.find((p) => p.name == "docId").value;
  const vaultId = customFields.find((p) => p.name == "vaultId").value;
  const majorVersion = customFields.find((p) => p.name == "majorVersion").value;
  const minorVersion = customFields.find((p) => p.name == "minorVersion").value;
  const completedAt = bodyData.completedDateTime;

  const veevaAuth = await authenticateVeeva(vaultUrl, username, password);

  if (!veevaAuth.success) {
    res.status(200).json(veevaAuth.data);
    return;
  }

  const sessionId = veevaAuth.data.sessionId;

  const updateDocData = await updateDocumentData(
    vaultUrl,
    sessionId,
    docId,
    completedAt
  );

  if (!updateDocData.success) {
    res.status(200).json(updateDocData.data);
    return;
  }

  const updateDocStatus = await updateDocumentStatus(
    vaultUrl,
    sessionId,
    docId,
    majorVersion,
    minorVersion
  );

  const docusignAuthReq = await fetch(
    `${process.env.APP_URL}/api/authDocusign?sessionId=${sessionId}`
  );

  const docusignAuth = await docusignAuthReq.json();

  await uploadSignedDocuments(
    docusignAuth.data.basePath,
    docusignAuth.data.accessToken,
    docusignAuth.data.apiAccountId,
    envelopeId,
    vaultUrl,
    docId,
    sessionId
  );

  res.status(200).json(updateDocStatus.data);
}

const updateDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  completedAt: string
) => {
  try {
    await fetch(`${vaultUrl}/objects/documents/${documentId}`, {
      headers: {
        Authorization: sessionId,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PUT",
      body: `signatures_completed__c=true&completed_date__c=${completedAt}&signature_status__c=Completed`,
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
  minorVersion: string
) => {
  try {
    await fetch(
      `${vaultUrl}/objects/documents/${documentId}/versions/${majorVersion}/${minorVersion}/lifecycle_actions/approve__c`,
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
          "signed.pdf",
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
