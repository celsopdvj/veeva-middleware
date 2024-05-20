import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const authDetails = await getAuthDetails(query.sessionId as string);

  return res.status(200).send(authDetails);
}

const getAuthDetails = async (sessionId: string) => {
  try {
    const vaultUrl =
      "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

    const fetchAllResponse = await fetch(
      `${vaultUrl}/vobjects/docusign_authentication__c?sort=created_date__v desc&limit=1&fields=id`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
        },
      }
    ).then((r) => r.json());

    if (fetchAllResponse?.data?.lenght == 0) {
      return {
        success: false,
        data: "No active DocuSign configuration found on Vault",
      };
    }

    const id = fetchAllResponse.data[0].id;

    const fetchSingleResponse = await fetch(
      `${vaultUrl}/vobjects/docusign_authentication__c/${id}?sort=created_date__v desc&limit=1&fields=authentication_url__c,client_id__c,private_key__c,user_id__c`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
        },
      }
    ).then((r) => r.json());

    return {
      success: true,
      data: (await fetchSingleResponse).data,
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};
