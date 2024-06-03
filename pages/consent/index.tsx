import { useSearchParams } from "next/navigation";

export default function Consent() {
  const searchParams = useSearchParams();
  const consentUrl = searchParams.get("consentUrl");

  return (
    <div className="w-full text-center font-semibold leading-6 text-orange-500 p-20">
      <p>
        Grant this app consent by clicking on the link below and reload this
        panel right after.
      </p>
      <p>
        <a
          className="cursor-pointer text-blue-600 hover:text-blue-700"
          href={consentUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
        >
          {consentUrl}
        </a>
      </p>
    </div>
  );
}
