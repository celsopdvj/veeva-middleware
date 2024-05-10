import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const router = useSearchParams();

  const docId = router.get("docId");
  const majVer = router.get("majVer");
  const minVer = router.get("minVer");
  const vaultid = router.get("vaultid");
  const latestVersion = router.get("latestVersion");
  const userId = router.get("userId");
  const userEmail = router.get("userEmail");

  const [docusignAuth, setDocusignAuth] = useState<any>({});
  const [veevaAuth, setVeevaAuth] = useState<any>({});
  const [documentInfo, setDocumentInfo] = useState<any>({});
  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<any>({});

  const handleCreateSignature = useCallback(async () => {
    setError("");
    const veevaAuthReq = await fetch("/api/authVeeva");

    let veevaAuthInfo = await veevaAuthReq.json();
    if (veevaAuthInfo.success) {
      setVeevaAuth(veevaAuthInfo.data);
    } else {
      setError(veevaAuthInfo.data);
      return;
    }

    const documentReq = await fetch(
      `/api/getVeevaDocument?sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}`
    );

    let documentInfoResponse = await documentReq.text();
    if (documentInfoResponse) {
      setDocumentInfo(documentInfoResponse);
    } else {
      setError(documentInfoResponse);
      return;
    }

    setError("");
    const docusignAuthReq = await fetch("/api/authDocusign");

    let accountInfo = await docusignAuthReq.json();
    if (accountInfo.success) {
      setDocusignAuth(accountInfo.data);
    } else {
      setError(accountInfo.data);
      return;
    }

    const signatureReq = await fetch(
      `/api/createSignature?accessToken=${accountInfo.data.accessToken}&basePath=${accountInfo.data.basePath}&accountId=${accountInfo.data.apiAccountId}`,
      {
        body: documentInfoResponse,
        method: "POST",
      }
    );

    const envelopeData = await signatureReq.json();

    if (envelopeData.success) {
      setEnvelope(envelopeData.data);
    } else {
      setError(envelopeData.data);
    }
  }, [docId]);

  useEffect(() => {
    handleCreateSignature();
  }, [handleCreateSignature]);

  return (
    <div>
      <span className="text-red-500 font-semibold">{error}</span>
      <div>
        {envelope.senderUrl && (
          <iframe
            className="w-full aspect-video"
            src={envelope.senderUrl}
          ></iframe>
        )}
      </div>
    </div>
  );
}
