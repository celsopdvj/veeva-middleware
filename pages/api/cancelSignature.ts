import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const documentInfo = await updateDocumentData(
    vaultUrl,
    query.sessionId as string,
    query.documentId as string
  );

  if (!documentInfo.success) {
    return res.status(200).send(documentInfo);
  }

  const documentStatusInfo = await updateDocumentStatus(
    vaultUrl,
    query.sessionId as string,
    query.documentId as string,
    query.majorVersion as string,
    query.minorVersion as string
  );

  if (!documentStatusInfo.success) {
    return res.status(200).send(documentStatusInfo);
  }

  return res.status(200).send({
    success: true,
    data: "Signature Cancelled",
  });
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
      body: `envelope_id__c=null&signature_status__c=Signature Request Cancelled`,
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
    const fethData = await fetch(
      `${vaultUrl}/objects/documents/${documentId}/versions/${majorVersion}/${minorVersion}/lifecycle_actions/send_to_ready_for_approval__c`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "PUT",
      }
    ).then((r) => r.json());

    console.log(fethData);

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
