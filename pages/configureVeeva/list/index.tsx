import { VeevaConfig } from "@/interfaces/veevaConfig";
import { useCallback, useEffect, useState } from "react";
import day from "dayjs";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import AccessDenied from "@/components/accessDenied";

export default function ListConfig() {
  const [configs, setConfigs] = useState([]);
  const { data: session, status } = useSession();

  const fetchConfigs = useCallback(async () => {
    const fetchResult = await fetch("/api/getVaultInfo/all");
    const configsResult = await fetchResult.json();

    setConfigs(configsResult);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  if (status === "loading") return <div>Loading...</div>;

  if (!session) {
    return <AccessDenied />;
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="flex gap-2 text-sm font-medium py-6">
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

        <div className="ml-auto px-12">
          <Link
            href="/configureVeeva"
            className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-md"
          >
            New
          </Link>
        </div>
      </div>

      <table className="lead">
        <thead className="text-left">
          <tr className="border-b-2">
            <th className="w-2/5">DNS</th>
            <th>Username</th>
            <th>Vault ID</th>
            <th>Created At</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config: VeevaConfig) => (
            <tr className="border-b-2" key={config.id}>
              <td>{config.dns}</td>
              <td>{config.username}</td>
              <td>{config.vaultid}</td>
              <td>{day(config.createdat).format("M/D/YYYY hh:mm A UTCZ")}</td>
              <td>{config.createdby}</td>
              <td className="flex gap-3 text-orange-500">
                <Link href={`/configureVeeva?id=${config.id}`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
