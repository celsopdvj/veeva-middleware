import { useSearchParams } from "next/navigation";

export default function ConsentSuccess() {
  const searchParams = useSearchParams();

  return (
    <div className="w-full text-center font-semibold leading-6 text-orange-500 p-20">
      <p>Consent was successfully granted. You can now close this tab.</p>
    </div>
  );
}
