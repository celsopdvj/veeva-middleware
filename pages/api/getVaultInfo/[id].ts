import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  const envolope = (await getVaultInfo(id as string)).rows;

  res.status(200).json(envolope);
}

const getVaultInfo = async (vaultId: string) => {
  let query = "SELECT * FROM veevaConfig";

  if (vaultId !== "all") {
    query += ` WHERE vaultId = '${vaultId}'`;
  }

  return await sql.query(query);
};
