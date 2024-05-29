import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function CancelSignature() {
  const searchParams = useSearchParams();

  const docId = searchParams.get("docId");
  const majVer = searchParams.get("majVer");
  const minVer = searchParams.get("minVer");
  const envelopeId = searchParams.get("envelopeId");

  const [message, setMessage] = useState("Cancelling...");

  const handleCancelSignature = useCallback(async () => {
    const veevaAuthReq = await fetch("/api/authVeeva");

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      setMessage(veevaAuthInfo.data);
      return;
    }

    const documentReq = await fetch(
      `/api/cancelSignature?sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}&majorVersion=${majVer}&minorVersion=${minVer}&envelopeId=${envelopeId}`
    );

    let documentInfoResponse = await documentReq.json();
    if (!documentInfoResponse.success) {
      setMessage(documentInfoResponse.data);
      return;
    }

    setMessage("Signature request cancelled");
  }, [docId, majVer, minVer, envelopeId]);

  useEffect(() => {
    handleCancelSignature();
  }, [handleCancelSignature]);

  return (
    <div className="w-full text-center font-semibold leading-6 text-indigo-600 p-20">
      {message}
    </div>
  );
}
