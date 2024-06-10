import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Access Denied
        </h2>
      </div>

      <div className="text-center text-md font-medium p-4">
        You must be
        <span className="text-orange-600 hover:text-orange-500">
          {" "}
          signed in{" "}
        </span>
        to view this page
      </div>

      <div>
        <div className="flex justify-center py-12">
          <button
            className="flex gap-6 items-center justify-center w-[250px] border-2 p-2 rounded-md text-sm"
            onClick={() => signIn("azure-ad")}
          >
            <Image
              src="https://authjs.dev/img/providers/azure.svg"
              width={20}
              height={20}
              alt="Azure Logo"
            />
            Sign in with Azure
          </button>
        </div>
      </div>
    </div>
  );
}
