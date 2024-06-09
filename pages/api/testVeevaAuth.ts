import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateVeeva } from "./common/functions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dns = req.query.dns;
  const username = req.query.username;
  const password = req.query.password;

  const authData = await authenticateVeeva(
    dns as string,
    username as string,
    password as string
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
