import { NextApiRequest, NextApiResponse } from "next";
import docusign from "docusign-esign";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query;

  const authDetails = await getAuthDetails(query.sessionId as string);
  if (!authDetails.success) {
    res.status(200).json(authDetails);
    return;
  }

  const { authentication_url__c, client_id__c, private_key__c, user_id__c } =
    authDetails.data;

  const auth = await authenticate(
    client_id__c,
    authentication_url__c,
    private_key__c,
    user_id__c
  );
  res.status(200).json(auth);
}

const SCOPES = ["signature", "impersonation"];

function getConsent(dsJWTClientId: string, dsOauthServer: string) {
  try {
    var urlScopes = SCOPES.join("+");

    // Construct consent URL
    var redirectUri = process.env.APP_URL;
    var consentUrl =
      `${dsOauthServer}/oauth/auth?response_type=code&` +
      `scope=${urlScopes}&client_id=${dsJWTClientId}&` +
      `redirect_uri=${redirectUri}`;

    return {
      success: false,
      consent: true,
      data: consentUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
}

async function getAuthDetails(sessionId: string) {
  const authDetails = await fetch(
    `${process.env.APP_URL}/api/getDocusignAuthConfig?sessionId=${sessionId}`
  );

  return authDetails.json();
}

async function authenticate(
  dsJWTClientId: string,
  dsOauthServer: string,
  privateKey: string,
  impersonatedUserGuid: string
) {
  try {
    const jwtLifeSec = 10 * 60; // requested lifetime for the JWT is 10 min
    const dsApi = new docusign.ApiClient();
    dsApi.setOAuthBasePath(dsOauthServer.replace("https://", "")); // it should be domain only.
    let rsaKey = Buffer.from(privateKey.replace(/\\n/g, "\n"));

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
      return getConsent(dsJWTClientId, dsOauthServer);
    }
    return {
      success: false,
      data: e.message,
    };
  }
}
