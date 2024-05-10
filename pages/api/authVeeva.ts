import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const username = "docusign_integration@partnersi-usdm.com";
  const password = "Vault2024!";

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const authData = await authenticate(vaultUrl, username, password);

  res.status(200).json(authData);
}

const authenticate = async (
  vaultUrl: string,
  username: string,
  password: string
) => {
  try {
    const response = await fetch(`${vaultUrl}/auth`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      method: "POST",
      body: `username=${username}&password=${password}`,
    });

    return {
      success: true,
      data: await response.json(),
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};
