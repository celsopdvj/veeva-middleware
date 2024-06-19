import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function CancelSignature() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docId = searchParams.get("docId");
  const majVer = searchParams.get("majVer");
  const minVer = searchParams.get("minVer");
  const envelopeId = searchParams.get("envelopeId");
  const vaultId = searchParams.get("vaultId");
  const userEmail = searchParams.get("userEmail");

  const [message, setMessage] = useState("Cancelling...");

  const handleCancelSignature = useCallback(async () => {
    if (!docId?.length || docId?.length == 0) {
      return;
    }

    const veevaAuthReq = await fetch(`/api/authVeeva?vaultId=${vaultId}`);

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      setMessage(veevaAuthInfo.data);
      return;
    }

    const docusignAuthReq = await fetch(
      `/api/authDocusign?sessionId=${veevaAuthInfo.data.sessionId}&vaultUrl=${veevaAuthInfo.vaultUrl}&email=${userEmail}`
    );

    let accountInfo = await docusignAuthReq.json();
    if (!accountInfo.success) {
      if (accountInfo.consent) {
        router.push(
          `/consent?consentUrl=${encodeURIComponent(
            accountInfo.consentUrl
          )}&adminConsentUrl=${encodeURIComponent(accountInfo.adminConsentUrl)}`
        );
      }
      setMessage(accountInfo.data);
      return;
    }

    const documentReq = await fetch(
      `/api/cancelSignature?accessToken=${accountInfo.data.accessToken}&basePath=${accountInfo.data.basePath}&accountId=${accountInfo.data.apiAccountId}&sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}&majorVersion=${majVer}&minorVersion=${minVer}&envelopeId=${envelopeId}&vaultUrl=${veevaAuthInfo.vaultUrl}`
    );

    let documentInfoResponse = await documentReq.json();
    if (!documentInfoResponse.success) {
      setMessage(documentInfoResponse.data);
      return;
    }

    setMessage("Signature request cancelled");
  }, [docId, majVer, minVer, envelopeId, router, vaultId, userEmail]);

  useEffect(() => {
    handleCancelSignature();
  }, [handleCancelSignature]);

  return (
    <div className="w-full text-center font-semibold leading-6 text-indigo-600 p-20">
      {message}
    </div>
  );
}
