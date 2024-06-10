import AccessDenied from "@/components/accessDenied";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WaitSignatures() {
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [dns, setDns] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { data: session, status } = useSession();

  const search = useSearchParams();

  const id = search.get("id") as string;

  const handleCheckVault = async () => {
    setIsFetching(true);
    setMessage("");
    setSuccessMessage("");
    const veevaAuthReq = await fetch(
      `/api/testVeevaAuth?dns=${dns}&username=${username}&password=${password}`
    );
    let veevaAuthInfo = await veevaAuthReq.json();
    setIsFetching(false);
    if (!veevaAuthInfo.success) {
      setMessage(veevaAuthInfo.data);
      return;
    }

    setVaultId(veevaAuthInfo.data.vaultId);
  };

  const handleSave = async () => {
    setIsFetching(true);
    setMessage("");
    setSuccessMessage("");
    const veevaAuthReq = await fetch(
      `/api/saveVeevaAuth?dns=${dns}&username=${username}&password=${password}&vaultId=${vaultId}&id=${id}`
    );

    let veevaAuthInfo = await veevaAuthReq.json();
    setIsFetching(false);
    if (!veevaAuthInfo.success) {
      setMessage(veevaAuthInfo.data);
      return;
    }
    setSuccessMessage("Vault configuration saved.");
  };

  const fetchConfig = useCallback(async () => {
    if (id?.length > 0) {
      const fetchResult = await fetch(`/api/getVaultById/${id}`);
      const vaultResult = await fetchResult.json();

      setDns(vaultResult[0].dns);
      setUsername(vaultResult[0].username);
      setPassword(vaultResult[0].password);
      setVaultId(vaultResult[0].vaultid);
    }
  }, [id]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  if (status === "loading") return <div>Loading...</div>;

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="flex gap-2 text-sm font-medium">
        <div>
          Logged in as <span className="italic">{session.user?.name}</span>
        </div>
        <span>|</span>
        <div>
          <button
            className="text-orange-600 hover:text-orange-500"
            onClick={(_) => signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Configure your Veeva Vault
        </h2>
      </div>

      <div className="mt-10 space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div>
          <label
            htmlFor="dns"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            DNS
          </label>
          <div className="mt-2">
            <input
              id="dns"
              name="dnsl"
              type="text"
              required
              value={dns}
              onKeyDown={(_) => setVaultId(null)}
              onChange={(v) => setDns(v.target.value)}
              placeholder="https://myvault.veevavault.com/api/v23.3"
              className="block w-full p-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="username"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Account
            </label>
          </div>
          <div className="mt-2">
            <input
              id="username"
              name="username"
              type="text"
              placeholder="user@domain.com"
              value={username}
              onKeyDown={(_) => setVaultId(null)}
              onChange={(v) => setUsername(v.target.value)}
              required
              className="block p-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Password
            </label>
          </div>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onKeyDown={(_) => setVaultId(null)}
              onChange={(v) => setPassword(v.target.value)}
              placeholder="Password"
              className="block p-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="vaultId"
              className="block text-sm font-medium leading-6 text-gray-500"
            >
              Vault ID
            </label>
          </div>
          <div className="mt-2">
            <input
              id="vaultId"
              name="vaultId"
              type="text"
              disabled
              required
              value={vaultId ?? ""}
              className="block p-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/configureVeeva/list"
            className="text-orange-500 hover:text-orange-600"
          >
            List existing configuration
          </Link>
        </div>

        <div>
          <button
            type="submit"
            disabled={isFetching}
            onClick={vaultId ? handleSave : handleCheckVault}
            className="flex w-full justify-center rounded-md bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            {vaultId ? "Save" : "Check"}
          </button>
        </div>

        <div>
          <span className="text-red-500">{message}</span>
        </div>
        <div>
          <span className="text-green-800">{successMessage}</span>
        </div>
      </div>
    </div>
  );
}
