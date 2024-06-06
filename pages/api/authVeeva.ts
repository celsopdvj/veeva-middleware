import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateVeeva } from "./common/functions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = "docusign_integration@partnersi-usdm.com";
  const password = "Vault2024!";

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const authData = await authenticateVeeva(vaultUrl, username, password);

  res.status(200).json(authData);
}
