import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";
import fs from "fs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await authenticate();

  console.log(auth);

  res.status(200).json(auth);
}

const SCOPES = ["signature", "impersonation"];
const dsJWTClientId = "e465cd59-f250-47c0-8488-1330bbc287d2";
const dsOauthServer = "https://account-d.docusign.com";
const privateKeyLocation = "./private.key";
const impersonatedUserGuid = "f15cbf02-0f65-45f7-b812-9247c6438cdf";

function getConsent() {
  try {
    var urlScopes = SCOPES.join("+");

    // Construct consent URL
    var redirectUri = "/";
    var consentUrl =
      `${dsOauthServer}/oauth/auth?response_type=code&` +
      `scope=${urlScopes}&client_id=${dsJWTClientId}&` +
      `redirect_uri=${redirectUri}`;

    return {
      success: false,
      data: consentUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
}

async function authenticate() {
  try {
    const jwtLifeSec = 10 * 60; // requested lifetime for the JWT is 10 min
    const dsApi = new docusign.ApiClient();
    dsApi.setOAuthBasePath(dsOauthServer.replace("https://", "")); // it should be domain only.
    let rsaKey = fs.readFileSync(privateKeyLocation);

    const results = await dsApi.requestJWTUserToken(
      dsJWTClientId,
      impersonatedUserGuid,
      SCOPES,
      rsaKey,
      jwtLifeSec
    );
    const accessToken = results.body.access_token;

    // get user info
    const userInfoResults = await dsApi.getUserInfo(accessToken);

    // use the default account
    let userInfo = userInfoResults.accounts.find(
      (account: any) => account.isDefault === "true"
    );

    return {
      success: true,
      data: {
        accessToken: results.body.access_token,
        apiAccountId: userInfo.accountId,
        basePath: `${userInfo.baseUri}/restapi`,
      },
    };
  } catch (e: any) {
    let body = e.response && e.response.body;
    // Determine the source of the error
    if (body && body.error && body.error === "consent_required") {
      // The user needs to grant consent
      return getConsent();
    }
    return {
      success: false,
      data: e.message,
    };
  }
}
