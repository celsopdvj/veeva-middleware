import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = "docusign_integration@partnersi-usdm.com";
  const password = "Vault2024!";

  const vaultUrl =
    "https://partnersi-usdm-qualitydocs.veevavault.com/api/v23.3";

  const bodyData = req.body.data.envelopeSummary;
  const customFields: any[] = bodyData.customFields.textCustomFields;
  const docId = customFields.find((p) => p.name == "docId").value;
  const vaultId = customFields.find((p) => p.name == "vaultId").value;
  const majorVersion = customFields.find((p) => p.name == "majorVersion").value;
  const minorVersion = customFields.find((p) => p.name == "minorVersion").value;
  const completedAt = bodyData.completedDateTime;

  const veevaAuth = await authenticateVeeva(vaultUrl, username, password);

  if (!veevaAuth.success) {
    res.status(200).json(veevaAuth.data);
    return;
  }

  const sessionId = veevaAuth.data.sessionId;

  const updateDocData = await updateDocumentData(
    vaultUrl,
    sessionId,
    docId,
    completedAt
  );

  if (!updateDocData.success) {
    res.status(200).json(updateDocData.data);
    return;
  }

  const updateDocStatus = await updateDocumentStatus(
    vaultUrl,
    sessionId,
    docId,
    majorVersion,
    minorVersion
  );

  res.status(200).json(updateDocStatus.data);
}

const updateDocumentData = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  completedAt: string
) => {
  try {
    await fetch(`${vaultUrl}/objects/documents/${documentId}`, {
      headers: {
        Authorization: sessionId,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "PUT",
      body: `signatures_completed__c=true&completed_date__c=${completedAt}`,
    }).then((r) => r.json());

    return {
      success: true,
      data: "Document Updated",
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

const updateDocumentStatus = async (
  vaultUrl: string,
  sessionId: string,
  documentId: string,
  majorVersion: string,
  minorVersion: string
) => {
  try {
    await fetch(
      `${vaultUrl}/objects/documents/${documentId}/versions/${majorVersion}/${minorVersion}/lifecycle_actions/retire__c`,
      {
        headers: {
          Authorization: sessionId,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "PUT",
      }
    ).then((r) => r.json());

    return {
      success: true,
      data: "Document State Updated",
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};

const authenticateVeeva = async (
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
    };
  } catch (error: any) {
    return {
      success: false,
      data: error.message,
    };
  }
};
