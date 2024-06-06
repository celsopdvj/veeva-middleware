// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";
import fs from "fs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const fileDetails = await getDocument(
    query.sessionId as string,
    query.documentId as string
  );

  const envolope = await sendEnvelope(
    query.basePath as string,
    query.accessToken as string,
    query.accountId as string,
    fileDetails.fileName ?? "",
    query.sessionId as string,
    query.documentId as string,
    query.majorVersion as string,
    query.minorVersion as string,
    fileDetails.file
  );

  res.status(200).json(envolope);
}

const getDocument = async (sessionId: string, documentId: string) => {
  const documentReq = await fetch(
    `${process.env.APP_URL}/api/getVeevaDocument?sessionId=${sessionId}&documentId=${documentId}`
  );

  let documentInfoResponse = await documentReq.arrayBuffer();
  if (!documentInfoResponse) {
    return {
      file: null,
      fileName: null,
    };
  }

  let fileName = "";
  let header = documentReq.headers.get("Content-Disposition");
  var filenameRegex = /filename[^;=\n]*=.*\'\'((['"]).*?\2|[^;\n]*)/;
  var matches = filenameRegex.exec(header ?? "");
  if (matches != null && matches[1]) {
    fileName = matches[1].replace(/['"]/g, "");
  }

  return {
    file: documentInfoResponse,
    fileName: fileName,
  };
};

const sendEnvelope = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  fileName: string,
  sessionId: string,
  documentId: string,
  majorVersion: string,
  minorVersion: string,
  fileBase64: ArrayBuffer | null
) => {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(basePath);
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    let results = null;

    // Make the envelope request body
    let envelope = makeEnvelope(
      fileName,
      fileBase64,
      documentId,
      "61653",
      majorVersion,
      minorVersion
    );

    // Call the Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition: envelope,
    });

    let envelopeId = results.envelopeId ?? "";

    //await envelopesApi.updateDocument(fileBase64, accountId, envelopeId, "1");

    const senderUrl = await envelopesApi.createSenderView(
      accountId,
      envelopeId,
      {
        envelopeViewRequest: {
          returnUrl: `${process.env.APP_URL}/waitSignatures?docId=${documentId}&majorVersion=${majorVersion}&minorVersion=${minorVersion}`,
          settings: {
            showHeaderActions: false,
          },
        },
      }
    );

    const updateData = await updateDocumentData(
      "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3",
      sessionId,
      documentId,
      envelopeId
    );

    if (!updateData.success) {
      return updateData;
    }

    const formattedSenderUrl = senderUrl.url
      ? senderUrl.url.replace("send=1", "send=0")
      : "";

    return {
      success: true,
      data: {
        envelopeId,
        senderUrl: formattedSenderUrl,
      },
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      data: error.message,
    };
  }
};

function makeEnvelope(
  fileName: string,
  fileBase64: ArrayBuffer | null,
  documentId: string,
  vaultId: string,
  majorVersion: string,
  minorVersion: string
) {
  // create the envelope definition
  let env: any = {};
  env.emailSubject = "Please sign this document set";

  // add the documents
  let doc1: any = {};
  fileBase64 &&
    (doc1.documentBase64 = Buffer.from(fileBase64).toString("base64"));
  doc1.name = fileName;
  doc1.fileExtension = fileName.split(".").pop();
  doc1.documentId = "1";

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];

  env.customFields = {
    textCustomFields: [
      {
        name: "docId",
        value: documentId,
        show: false,
      },
      {
        name: "vaultId",
        value: vaultId,
        show: false,
      },
      {
        name: "majorVersion",
        value: majorVersion,
        show: false,
      },
      {
        name: "minorVersion",
        value: minorVersion,
        show: false,
      },
    ],
  };

  return env;
}

const updateDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  envelopeId: string
) => {
  try {
    await fetch(`${vaultUrl}/objects/documents/${documentId}`, {
      headers: {
        Authorization: sessionId,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PUT",
      body: `envelope_id__c=${envelopeId}&signature_status__c=Waiting Signatures&signature_request_sent__c=false`,
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
