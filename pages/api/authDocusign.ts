import { NextApiRequest, NextApiResponse } from "next";
import { authenticateDocusign } from "./common/functions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const authDetails = await getAuthDetails(
    query.sessionId as string,
    query.vaultUrl as string
  );
  if (!authDetails.success) {
    res.status(200).json(authDetails);
    return;
  }

  const {
    authentication_url__c,
    client_id__c,
    private_key__c,
    user_id__c,
    api_account_id__c,
  } = authDetails.data;

  const auth = await authenticateDocusign(
    client_id__c,
    authentication_url__c,
    private_key__c,
    user_id__c,
    api_account_id__c,
    query.email as string
  );
  res.status(200).json(auth);
}

async function getAuthDetails(sessionId: string, vaultUrl: string) {
  const authDetails = await fetch(
    `${process.env.APP_URL}/api/getDocusignAuthConfig?sessionId=${sessionId}&vaultUrl=${vaultUrl}`
  );

  return authDetails.json();
}
