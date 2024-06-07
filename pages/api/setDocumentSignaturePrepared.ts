import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const updateResponse = await updateDocumentData(
    query.vaultUrl as string,
    query.sessionId as string,
    query.documentId as string
  );

  if (!updateResponse.success) {
    res.status(200).json(updateResponse);
    return;
  }

  const updateStatusResponse = await updateDocumentStatus(
    query.vaultUrl as string,
    query.sessionId as string,
    query.documentId as string,
    query.majorVersion as string,
    query.minorVersion as string
  );

  res.status(200).json(updateStatusResponse);
}

const updateDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string
) => {
  try {
    await fetch(`${vaultUrl}/objects/documents/${documentId}`, {
      headers: {
        Authorization: sessionId,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PUT",
      body: `signature_request_sent__c=true`,
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
      `${vaultUrl}/objects/documents/${documentId}/versions/${majorVersion}/${minorVersion}/lifecycle_actions/send_to_docusign__c`,
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
