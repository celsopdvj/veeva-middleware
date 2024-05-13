import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useSearchParams();

  const docId = router.get("docId");
  // const majVer = router.get("majVer");
  // const minVer = router.get("minVer");
  // const vaultid = router.get("vaultid");
  // const latestVersion = router.get("latestVersion");
  // const userId = router.get("userId");
  // const userEmail = router.get("userEmail");

  const [docusignAuth, setDocusignAuth] = useState<any>({});
  const [veevaAuth, setVeevaAuth] = useState<any>({});
  const [documentInfo, setDocumentInfo] = useState<any>({});
  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<any>({});

  const handleCreateSignature = async () => {
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

    let documentInfoResponse = await documentReq.json();
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
      `/api/createSignature?accessToken=${accountInfo.data.accessToken}&basePath=${accountInfo.data.basePath}&accountId=${accountInfo.data.apiAccountId}&name=${documentInfoResponse.name}`,
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
