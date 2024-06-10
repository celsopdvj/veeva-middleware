import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { VeevaConfig } from "@/interfaces/veevaConfig";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  const envolope = (await getVaultInfo(id as string)).rows;

  res.status(200).json(envolope);
}

const getVaultInfo = async (configId: string) => {
  return await sql<VeevaConfig>`
        SELECT *
        FROM veevaConfig
        WHERE id = ${configId}`;
};
