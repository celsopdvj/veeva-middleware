"use client";

import { useSearchParams } from "next/navigation";

export default function ShowParams() {
  const router = useSearchParams();

  const docId = router.get("docId");
  const majVer = router.get("majVer");
  const minVer = router.get("minVer");
  const vaultid = router.get("vaultid");
  const latestVersion = router.get("latestVersion");

  return (
    <ul>
      <li>{docId}</li>
      <li>{majVer}</li>
      <li>{minVer}</li>
      <li>{vaultid}</li>
      <li>{latestVersion}</li>
    </ul>
  );
}
