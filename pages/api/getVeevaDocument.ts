import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const documentResponse = await getDocumentContent(
    query.vaultUrl as string,
    query.sessionId as string,
    query.documentId as string
  );

  if (!documentResponse?.file) {
    res.send(404);
    return;
  }

  const nodeReadableStream = Readable.from(documentResponse.file);
  res.setHeader("Content-Disposition", documentResponse.fileName ?? "");
  nodeReadableStream.pipe(res);
}

const getDocumentContent = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string
) => {
  try {
    const fetchResponse = await fetch(
      `${vaultUrl}/objects/documents/${documentId}/file`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
          "Content-Type": "application/octet-stream; charset=UTF-8",
        },
      }
    );

    const header = fetchResponse.headers.get("Content-Disposition");

    return {
      fileName: header,
      file: fetchResponse.body as unknown as NodeJS.ReadableStream,
    };
  } catch (error: any) {
    return null;
  }
};
