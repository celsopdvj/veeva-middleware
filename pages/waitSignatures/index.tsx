import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WaitSignatures() {
  const searchParams = useSearchParams();
  const [isUpdatingDocument, setIsUpdatingDocument] = useState(false);

  const docId = searchParams.get("docId");

  const handleUpdateDocument = useCallback(async () => {
    setIsUpdatingDocument(true);
    const veevaAuthReq = await fetch("/api/authVeeva");

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      return;
    }

    await fetch(
      `/api/setDocumentSignaturaPrepared?sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}`
    );

    setIsUpdatingDocument(false);
  }, [docId]);

  useEffect(() => {
    handleUpdateDocument();
  }, [handleUpdateDocument]);

  return (
    <div className="w-full text-center font-semibold leading-6 text-indigo-600 p-20">
      {isUpdatingDocument ? "Loading..." : "Signature request completed!"}
    </div>
  );
}
