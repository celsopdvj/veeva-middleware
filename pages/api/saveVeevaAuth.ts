import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const dns = req.query.dns as string;
    const username = req.query.username as string;
    const password = req.query.password as string;
    const vaultId = req.query.vaultId as string;
    const id = req.query.id as string;

    if (id != "null") {
      await sql.query(
        `
          update veevaconfig
          set
            vaultId = $2,
            name = $3,
            dns = $3,
            username = $4,
            password = $5
          where id = $1
       `,
        [id, vaultId, dns, username, password]
      );
    } else {
      await sql.query(
        `
          insert into veevaconfig (id, vaultId, name, dns, username, password, createdBy, createdAt)
          values
              (
                  uuid_generate_v4(),
                  $1,
                  $2,
                  $3,
                  $4,
                  $5,
                  $6,
                  now()
              )
    `,
        [vaultId, dns, dns, username, password, "celso"]
      );
    }

    res.status(200).json({
      success: true,
      data: "Vault configuration saved.",
    });
  } catch (error: any) {
    res.status(200).json({
      success: false,
      data: error.message,
    });
    return;
  }
}
