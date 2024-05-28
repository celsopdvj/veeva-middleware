import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const docId = searchParams.get("docId");
  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<any>({});

  const handleCreateSignature = async () => {
    setError("");
    const veevaAuthReq = await fetch("/api/authVeeva");

    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      setError(veevaAuthInfo.data);
      return;
    }

    const documentReq = await fetch(
      `/api/getVeevaDocument?sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}`
    );

    let documentInfoResponse = await documentReq.json();
    if (!documentInfoResponse) {
      setError("Document not found");
      return;
    }

    setError("");
    const docusignAuthReq = await fetch(
      `/api/authDocusign?sessionId=${veevaAuthInfo.data.sessionId}`
    );

    let accountInfo = await docusignAuthReq.json();
    if (!accountInfo.success) {
      if (accountInfo.consent) {
        router.push(accountInfo.data);
      }
      setError(accountInfo.data);
      return;
    }

    const signatureReq = await fetch(
      `/api/createSignature?accessToken=${accountInfo.data.accessToken}&basePath=${accountInfo.data.basePath}&accountId=${accountInfo.data.apiAccountId}&name=${documentInfoResponse.name}&sessionId=${veevaAuthInfo.data.sessionId}&documentId=${docId}`,
      {
        body: documentInfoResponse.content,
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
              "&showHeaderActions=false&showEditDocuments=false&showEditDocumentVisibility=false&showEditPages=false&showDiscardAction=false&send=0"
            }
          ></iframe>
        ) : (
          <div>
            <button
              onClick={handleCreateSignature}
              className="m-20 justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create Signature Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
