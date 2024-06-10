import { signIn } from "next-auth/react";
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
        You must be{" "}
        <Link
          className="text-orange-600 hover:text-orange-500"
          href="/api/auth/signin"
          onClick={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          signed in
        </Link>{" "}
        to view this page
      </div>
    </div>
  );
}
