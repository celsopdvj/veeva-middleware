import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const documentResponse = await getDocumentRendition(
    vaultUrl,
    query.sessionId as string,
    query.documentId as string
  );

  const documentInfo = await getDocumentData(
    vaultUrl,
    query.sessionId as string,
    query.documentId as string
  );

  return res.status(200).send({
    name: documentInfo,
    content: documentResponse,
  });
}

const getDocumentRendition = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string
) => {
  try {
    const fetchResponse = await fetch(
      `${vaultUrl}/objects/documents/${documentId}/renditions/viewable_rendition__v`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
        },
      }
    )
      .then((r) => r.arrayBuffer())
      .then((b) => Buffer.from(b).toString("base64"));

    return fetchResponse;
  } catch (error: any) {
    return null;
  }
};

const getDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string
) => {
  try {
    const fetchResponse = await fetch(
      `${vaultUrl}/objects/documents/${documentId}`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((r) => r.document.name__v);

    return fetchResponse;
  } catch (error: any) {
    return null;
  }
};
