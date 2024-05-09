import { useSearchParams } from "next/navigation";
import fs from "fs";
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

  const handleAuth = async () => {
    setError("");
    const req = await fetch("/api/authDocusign");

    let accountInfo = await req.json();
    if (accountInfo.success) {
      setAuth(accountInfo.data);
    } else {
      setError(accountInfo.data);
    }
  };

  const handleSend = async () => {
    setError("");
    let envelopeId = await fetch(
      `/api/createSignature?accessToken=${auth.accessToken}&basePath=${auth.basePath}&accountId=${auth.apiAccountId}`
    );
    console.log(envelopeId);
  };

  return (
    <ul>
      <li>{docId}</li>
      <li>{majVer}</li>
      <li>{minVer}</li>
      <li>{vaultid}</li>
      <li>{latestVersion}</li>
      <li>{userId}</li>
      <li>{userEmail}</li>
      <li>Access Token: {auth.accessToken}</li>
      <li>
        <button onClick={handleAuth}>Auth</button>
      </li>
      <li>
        <button onClick={handleSend}>Send</button>
      </li>
      <li>{error}</li>
    </ul>
  );
}
