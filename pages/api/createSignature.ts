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
    fileBase64
  );

  res.status(200).json(envolope);
}

const sendEnvelope = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  fileName: string,
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
