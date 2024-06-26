import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateVeeva, getVaultInfo } from "./common/functions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const vaultId = req.query.vaultId;
  const { success, vault, data } = await getVaultInfo(vaultId as string);

  if (!success) {
    res.status(200).json({
      success,
      data,
    });
    return;
  }

  const authData = await authenticateVeeva(
    vault.dns,
    vault.username,
    vault.password
  );

  if (authData.data.responseMessage) {
    res.status(200).json({
      success: false,
      data: authData.data.responseMessage,
    });
    return;
  }

  res.status(200).json(authData);
}
