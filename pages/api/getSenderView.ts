import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const envolope = await getSenderView(
    query.basePath as string,
    query.accessToken as string,
    query.accountId as string,
    query.envelopeId as string
  );

  res.status(200).json(envolope);
}

const getSenderView = async (
  basePath: string,
  accessToken: string,
  accountId: string,
  envelopeId: string
) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  const senderUrl = await envelopesApi.createSenderView(accountId, envelopeId, {
    envelopeViewRequest: {
      returnUrl: `${process.env.APP_URL}/WaitSignatures`,
      settings: {
        showHeaderActions: false,
      },
    },
  });

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
};
