import { VeevaConfig } from "@/interfaces/veevaConfig";
import docusign from "docusign-esign";

export const authenticateVeeva = async (
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
      vaultUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

const DOCUSIGN_SCOPES = ["signature", "impersonation"];

export async function authenticateDocusign(
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

    const resultsAdmin = await dsApi.requestJWTUserToken(
      dsJWTClientId,
      impersonatedUserGuid,
      DOCUSIGN_SCOPES,
      rsaKey,
      jwtLifeSec
    );
    const accessTokenAdmin = resultsAdmin.body.access_token;
    const userInfoResultsAdmin = await dsApi.getUserInfo(accessTokenAdmin);

    let userInfoAdmin = userInfoResultsAdmin.accounts.find(
      (account: any) => account.isDefault === "true"
    );

    dsApi.setBasePath(`${userInfoAdmin.baseUri}/restapi`);
    dsApi.addDefaultHeader("Authorization", "Bearer " + accessTokenAdmin);
    const usApi = new docusign.UsersApi(dsApi);

    let user: any = {};

    try {
      const userList = await usApi.list(userInfoAdmin.accountId, {
        email: "jmurray@usdm.com",
      });

      userList?.users && (user = userList?.users[0]);
    } catch (error: any) {
      console.log(error.message);
      return {
        success: false,
        data: "User not found",
      };
    }

    const results = await dsApi.requestJWTUserToken(
      dsJWTClientId,
      user.userId,
      DOCUSIGN_SCOPES,
      rsaKey,
      jwtLifeSec
    );

    const accessToken = results.body.access_token;
    const userInfoResults = await dsApi.getUserInfo(accessToken);

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
      return getDocusignConsent(dsJWTClientId, dsOauthServer);
    }
    return {
      success: false,
      data: e.message,
    };
  }
}

function getDocusignConsent(dsJWTClientId: string, dsOauthServer: string) {
  try {
    var urlScopes = DOCUSIGN_SCOPES.join("+");

    // Construct consent URL
    var redirectUri = `${process.env.APP_URL}/consent/success`;
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

type VaultInfoRespose = {
  success: boolean;
  data: string | null;
  vault: VeevaConfig;
};

export const getVaultInfo = async (
  vaultId: string
): Promise<VaultInfoRespose> => {
  const vaultInfoReq = await fetch(
    `${process.env.APP_URL}/api/getVaultInfo/${vaultId}`
  );
  const vaults: VeevaConfig[] = await vaultInfoReq.json();

  if (vaults.length == 0) {
    return {
      success: false,
      data: "Could't find Vault configuration",
      vault: {} as VeevaConfig,
    };
  }

  return {
    success: true,
    data: null,
    vault: vaults.pop() ?? ({} as VeevaConfig),
  };
};
