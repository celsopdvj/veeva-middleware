import { VeevaConfig } from "@/interfaces/veevaConfig";
import { useCallback, useEffect, useState } from "react";
import day from "dayjs";

export default function ListConfig() {
  const [configs, setConfigs] = useState([]);

  const fetchConfigs = useCallback(async () => {
    const fetchResult = await fetch("/api/getVaultInfo/all");
    const configsResult = await fetchResult.json();

    setConfigs(configsResult);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
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
                <a href={`/configureVeeva?id=${config.id}`}>Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
