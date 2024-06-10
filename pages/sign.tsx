import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Sign() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docId = searchParams.get("docId");
  const majVer = searchParams.get("majVer");
  const minVer = searchParams.get("minVer");
  const envelopeId = searchParams.get("envelopeId");
  const vaultId = searchParams.get("vaultId");

  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<any>({});
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isFetchingSenderUrl, setIsFetchingSenderUrl] = useState(false);
  const [veevaAuthDetails, setVeevaAuthDetails] = useState<any | null>(null);
  const [vaultUrl, setVaultUrl] = useState("");
  const [docuSignAuthDetails, setDocuSignAuthDetails] = useState<any | null>(
    null
  );

  const isEnvelopeIdFilled = (envelopeId?.length ?? 0) > 0;
  const shouldDisableButton =
    isAuthenticating || isEnvelopeIdFilled || isFetchingSenderUrl;

  const buttonMessage = () => {
    if (isAuthenticating) return "Authenticating";
    if (isFetchingSenderUrl) return "Preparing DocuSign View";

    return "Create Signature Request";
  };

  const handleAuth = useCallback(async () => {
    if (!docId?.length || docId?.length == 0) return;

    setError("");
    const veevaAuthReq = await fetch(`/api/authVeeva?vaultId=${vaultId}`);

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      setError(veevaAuthInfo.data);
      setIsAuthenticating(false);
      return;
    }

    setVeevaAuthDetails(veevaAuthInfo.data);
    setVaultUrl(veevaAuthInfo.vaultUrl);

    setError("");
    const docusignAuthReq = await fetch(
      `/api/authDocusign?sessionId=${veevaAuthInfo.data.sessionId}&vaultUrl=${veevaAuthInfo.vaultUrl}`
    );

    let accountInfo = await docusignAuthReq.json();
    if (!accountInfo.success) {
      setIsAuthenticating(false);
      if (accountInfo.consent) {
        router.push(
          `/consent?consentUrl=${encodeURIComponent(accountInfo.data)}`
        );
      }
      setError(accountInfo.data);
      return;
    }

    setDocuSignAuthDetails(accountInfo.data);

    setIsAuthenticating(false);
  }, [router, docId, vaultId]);

  const handleCreateSenderView = useCallback(async () => {
    if (!envelopeId?.length || envelopeId?.length == 0) return;
    if (!docuSignAuthDetails) return;

    setIsFetchingSenderUrl(true);

    const senderViewReq = await fetch(
      `/api/getSenderView?accessToken=${docuSignAuthDetails.accessToken}&basePath=${docuSignAuthDetails.basePath}&accountId=${docuSignAuthDetails.apiAccountId}&envelopeId=${envelopeId}`
    );

    const envelopeData = await senderViewReq.json();

    if (envelopeData.success) {
      setEnvelope(envelopeData.data);
    } else {
      setError(envelopeData.data);
    }

    setIsFetchingSenderUrl(false);
  }, [docuSignAuthDetails, envelopeId]);

  useEffect(() => {
    handleAuth();
  }, [handleAuth]);

  useEffect(() => {
    !isAuthenticating && handleCreateSenderView();
  }, [handleCreateSenderView, isAuthenticating]);

  const handleCreateSignature = async () => {
    const signatureReq = await fetch(
      `/api/createSignature?accessToken=${docuSignAuthDetails.accessToken}&basePath=${docuSignAuthDetails.basePath}&accountId=${docuSignAuthDetails.apiAccountId}&sessionId=${veevaAuthDetails.sessionId}&documentId=${docId}&majorVersion=${majVer}&minorVersion=${minVer}&vaultId=${vaultId}&vaultUrl=${vaultUrl}`,
      {
        method: "POST",
      }
    );

    const envelopeData = await signatureReq.json();

    if (envelopeData.success) {
      setEnvelope(envelopeData.data);
    } else {
      setError(envelopeData.data);
    }
  };

  return (
    <div>
      <span className="text-red-500 font-semibold">{error}</span>
      <div>
        {envelope.senderUrl ? (
          <iframe
            className="w-full aspect-video"
            src={
              envelope.senderUrl +
              "&showHeaderActions=false&showEditDocuments=false&showEditDocumentVisibility=false&showEditPages=false&showDiscardAction=false"
            }
          ></iframe>
        ) : (
          <div>
            <button
              onClick={handleCreateSignature}
              disabled={shouldDisableButton}
              className="m-20 justify-center rounded-md disabled:bg-indigo-300 disabled:cursor-default bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {buttonMessage()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
