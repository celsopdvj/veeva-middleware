import type { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

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

  const cancelDocusignResult = await cancelDocusign(
    query.basePath as string,
    query.accessToken as string,
    query.accountId as string,
    query.envelopeId as string
  );

  if (!cancelDocusignResult.success) {
    return res.status(200).send(cancelDocusignResult);
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
    await fetch(
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

const cancelDocusign = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  envelopeId: string
) => {
  try {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(basePath);
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    const data = await envelopesApi.update(accountId, envelopeId, {
      envelope: {
        status: "voided",
        voidedReason: "Canceled by the Veeva user",
      },
    });

    console.log(data);

    return {
      success: true,
      data: "Envelope voided",
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};
