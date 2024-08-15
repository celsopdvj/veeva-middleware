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

async function authAdmin(
  dsJWTClientId: string,
  dsOauthServer: string,
  privateKey: string,
  impersonatedUserGuid: string,
  apiAccountId: string,
  email: string
) {
  try {
    const jwtLifeSec = 10 * 60;
    const dsApi = new docusign.ApiClient();

    dsApi.setOAuthBasePath(dsOauthServer.replace("https://", ""));
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
      (account: any) => account.accountId === apiAccountId
    );

    if (!userInfoAdmin) {
      return {
        success: false,
        data: `User ${impersonatedUserGuid} not found on account ID ${apiAccountId}`,
      };
    }

    if (!email || email == "null" || email.length == 0) {
      return {
        success: true,
        data: {
          accessToken: accessTokenAdmin,
          apiAccountId: userInfoAdmin.accountId,
          basePath: `${userInfoAdmin.baseUri}/restapi`,
          user: null,
        },
      };
    }

    dsApi.setBasePath(`${userInfoAdmin.baseUri}/restapi`);
    dsApi.addDefaultHeader("Authorization", "Bearer " + accessTokenAdmin);
    const usApi = new docusign.UsersApi(dsApi);

    let user: any = {};

    try {
      const userList = await usApi.list(userInfoAdmin.accountId, {
        email,
      });

      userList?.users && (user = userList?.users[0]);
    } catch (error: any) {
      return {
        success: false,
        data: `User with email ${email} not found on Docusign.`,
        userNotFound: true,
      };
    }

    return {
      success: true,
      data: {
        accessToken: accessTokenAdmin,
        apiAccountId: userInfoAdmin.accountId,
        basePath: `${userInfoAdmin.baseUri}/restapi`,
        user: user,
      },
    };
  } catch (e: any) {
    return isConsentRequired(e, dsJWTClientId, dsOauthServer);
  }
}

export async function authenticateDocusign(
  dsJWTClientId: string,
  dsOauthServer: string,
  privateKey: string,
  impersonatedUserGuid: string,
  apiAccountId: string,
  email: string
) {
  try {
    const adminAuth = await authAdmin(
      dsJWTClientId,
      dsOauthServer,
      privateKey,
      impersonatedUserGuid,
      apiAccountId,
      email
    );

    if (!adminAuth.success || !adminAuth.data.user) {
      return adminAuth;
    }

    const jwtLifeSec = 10 * 60;
    const dsApi = new docusign.ApiClient();

    dsApi.setOAuthBasePath(dsOauthServer.replace("https://", ""));
    let rsaKey = Buffer.from(privateKey.replace(/\\n/g, "\n"));

    const results = await dsApi.requestJWTUserToken(
      dsJWTClientId,
      adminAuth.data.user.userId,
      DOCUSIGN_SCOPES,
      rsaKey,
      jwtLifeSec
    );

    const accessToken = results.body.access_token;
    const userInfoResults = await dsApi.getUserInfo(accessToken);

    let userInfo = userInfoResults.accounts.find(
      (account: any) => account.accountId === apiAccountId
    );

    if (!userInfo) {
      return {
        success: false,
        data: `User ${email} not found on account ID ${apiAccountId}`,
      };
    }

    return {
      success: true,
      data: {
        accessToken: results.body.access_token,
        apiAccountId: userInfo.accountId,
        basePath: `${userInfo.baseUri}/restapi`,
      },
    };
  } catch (e: any) {
    return isConsentRequired(e, dsJWTClientId, dsOauthServer);
  }
}

function isConsentRequired(
  e: any,
  dsJWTClientId: string,
  dsOauthServer: string
) {
  let body = e.response && e.response.body;
  let bodyErr = e.response && e.response.data;
  // Determine the source of the error
  if (
    (body && body.error && body.error === "consent_required") ||
    (bodyErr && bodyErr.error && bodyErr.error === "consent_required")
  ) {
    // The user needs to grant consent
    return {
      success: false,
      consent: true,
      consentUrl: getDocusignConsent(dsJWTClientId, dsOauthServer),
      adminConsentUrl: getDocusignAdminConsent(dsJWTClientId, dsOauthServer),
      data: "Consent required",
    };
  }
  return {
    success: false,
    data: e.message,
  };
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

    return consentUrl;
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
}

function getDocusignAdminConsent(dsJWTClientId: string, dsOauthServer: string) {
  try {
    var urlScopes = DOCUSIGN_SCOPES.join("+");

    // Construct consent URL
    var redirectUri = `${process.env.APP_URL}/consent/success`;
    var consentUrl =
      `${dsOauthServer}/oauth/auth?response_type=code&` +
      `scope=openid&` +
      `admin_consent_scope=${urlScopes}&client_id=${dsJWTClientId}&` +
      `redirect_uri=${redirectUri}`;

    return consentUrl;
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
