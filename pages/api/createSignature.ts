// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const fileBase64 = req.body as string;

  const envolope = await sendEnvelope(
    query.basePath as string,
    query.accessToken as string,
    query.accountId as string,
    query.name as string,
    query.sessionId as string,
    query.documentId as string,
    fileBase64
  );

  res.status(200).json(envolope);
}

const sendEnvelope = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  fileName: string,
  sessionId: string,
  documentId: string,
  fileBase64: string
) => {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(basePath);
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    let results = null;

    // Make the envelope request body
    let envelope = makeEnvelope(fileName, fileBase64);

    // Call the Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition: envelope,
    });
    let envelopeId = results.envelopeId ?? "";

    const senderUrl = await envelopesApi.createSenderView(
      accountId,
      envelopeId,
      {
        returnUrlRequest: {
          returnUrl: `${process.env.APP_URL}/WaitSignatures`,
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

    console.log(updateData);

    if (!updateData.success) {
      return updateData;
    }

    return {
      success: true,
      data: {
        envelopeId,
        senderUrl: senderUrl.url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

function makeEnvelope(fileName: string, fileBase64: string) {
  // create the envelope definition
  let env: any = {};
  env.emailSubject = "Please sign this document set";

  // add the documents
  let doc1: any = {};
  doc1.documentBase64 = fileBase64;
  doc1.name = fileName;
  doc1.fileExtension = "pdf";
  doc1.documentId = "1";

  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];

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
      body: `envelope_id__c=${envelopeId}&signature_status__c=Waiting Signatures`,
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
