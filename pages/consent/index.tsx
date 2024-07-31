import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Consent() {
  const searchParams = useSearchParams();
  const consentUrl = searchParams.get("consentUrl");
  const adminConsentUrl = searchParams.get("adminConsentUrl");
  const email = searchParams.get("email");

  return (
    <div className="w-full text-center font-semibold leading-6 text-orange-500 p-20">
      <div className="my-4">
        Grant this app consent by clicking on the link below and reload this
        panel right after.
      </div>
      <div className="flex gap-8 justify-center">
        <Link
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
          href={consentUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
        >
          Individual Consent
        </Link>
        <Link
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
          href={adminConsentUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
        >
          Admin Consent
        </Link>
      </div>
      <div className="my-4 font-semibold text-sm text-gray-600 italic">
        Your Docusign account email needs to match your Veeva user email (
        {email}).
      </div>
    </div>
  );
}
