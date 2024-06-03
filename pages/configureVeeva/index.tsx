import { useState } from "react";

export default function WaitSignatures() {
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleCheckVault = async () => {
    const veevaAuthReq = await fetch("/api/authVeeva");
    let veevaAuthInfo = await veevaAuthReq.json();
    if (!veevaAuthInfo.success) {
      setMessage(veevaAuthInfo.data);
      return;
    }

    setVaultId(veevaAuthInfo.data.vaultId);
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-10 w-auto"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          alt="Your Company"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Configure your Veeva Vault
        </h2>
      </div>

      <div className="mt-10 space-y-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            DNS
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="email"
              required
              placeholder="https://myvault.veevavault.com"
              className="block w-full p-2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Account
            </label>
          </div>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="text"
              placeholder="user@domain.com"
              autoComplete="current-password"
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
              autoComplete="current-password"
              required
              placeholder="Password"
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
              Vault ID
            </label>
          </div>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="text"
              disabled
              autoComplete="current-password"
              required
              value={vaultId ?? ""}
              className="block p-2 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            onClick={handleCheckVault}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {vaultId ? "Save" : "Check"}
          </button>
        </div>
      </div>
    </div>
  );
}
