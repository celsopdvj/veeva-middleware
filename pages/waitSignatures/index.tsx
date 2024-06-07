import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WaitSignatures() {
  const searchParams = useSearchParams();
  const [isUpdatingDocument, setIsUpdatingDocument] = useState(false);

  const docId = searchParams.get("docId");
  const majorVersion = searchParams.get("majorVersion");
  const minorVersion = searchParams.get("minorVersion");
  const vaultId = searchParams.get("vaultId");

  const handleUpdateDocument = useCallback(async () => {
    if ((docId?.length ?? 0) == 0) return;
    setIsUpdatingDocument(true);
    const veevaAuthReq = await fetch(`/api/authVeeva?vaultId=${vaultId}`);

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      return;
    }

    await fetch(
      `/api/setDocumentSignaturePrepared?sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}&majorVersion=${majorVersion}&minorVersion=${minorVersion}&vaultUrl=${veevaAuthInfo.vaultUrl}`
    );

    setIsUpdatingDocument(false);
  }, [docId, majorVersion, minorVersion, vaultId]);

  useEffect(() => {
    handleUpdateDocument();
  }, [handleUpdateDocument]);

  return (
    <div className="w-full text-center font-semibold leading-6 text-indigo-600 p-20">
      {isUpdatingDocument ? "Loading..." : "Signature request completed!"}
    </div>
  );
}
