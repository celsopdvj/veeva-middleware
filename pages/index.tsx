import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useSearchParams();

  const docId = router.get("docId");
  const majVer = router.get("majVer");
  const minVer = router.get("minVer");
  const vaultid = router.get("vaultid");
  const latestVersion = router.get("latestVersion");
  const userId = router.get("userId");
  const userEmail = router.get("userEmail");

  const [auth, setAuth] = useState<any>({});
  const [error, setError] = useState("");
  const [envelope, setEnvelope] = useState<any>({});

  const handleCreateSignature = async () => {
    setError("");
    const authReq = await fetch("/api/authDocusign");

    let accountInfo = await authReq.json();
    if (accountInfo.success) {
      setAuth(accountInfo.data);
    } else {
      setError(accountInfo.data);
      return;
    }

    const signatureReq = await fetch(
      `/api/createSignature?accessToken=${accountInfo.data.accessToken}&basePath=${accountInfo.data.basePath}&accountId=${accountInfo.data.apiAccountId}`
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
      <div className="grid grid-cols-[80%_20%]">
        {envelope.senderUrl ? (
          <iframe
            className="w-full aspect-video"
            src={envelope.senderUrl}
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
        <div>
          <div className="rounded-md border-0 m-2 p-2 text-gray-900 shadow-sm ring-1 ">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Doc ID
            </label>
            <div className="mb-2">
              <span>{docId}</span>
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Major Version
            </label>
            <div className="mb-2">
              <span>{majVer}</span>
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Minor Version
            </label>
            <div className="mb-2">
              <span>{minVer}</span>
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Is Latest Version
            </label>
            <div className="mb-2">
              <span>{latestVersion}</span>
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Logged in User ID
            </label>
            <div className="mb-2">
              <span>{userId}</span>
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Logged in User Email
            </label>
            <div className="mb-2">
              <span>{userEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
