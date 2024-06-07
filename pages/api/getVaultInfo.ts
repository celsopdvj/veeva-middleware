import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { VeevaConfig } from "@/interfaces/veevaConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const envolope = (await getVaultInfo(query.vaultId as string)).rows;

  res.status(200).json(envolope);
}

const getVaultInfo = async (vaultId: string) => {
  return await sql<VeevaConfig>`
        SELECT *
        FROM veevaConfig
        WHERE vaultId = ${vaultId}`;
};
