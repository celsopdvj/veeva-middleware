import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const documentResponse = await getDocument(
    vaultUrl,
    query.sessionId as string,
    query.documentId as string
  );

  return res.status(200).send(documentResponse);
}

const getDocument = async (
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
