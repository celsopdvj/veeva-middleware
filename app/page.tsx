"use client";

import { Suspense } from "react";
import ShowParams from "./show-params";

export default function Home() {
  return (
    <div>
      <Suspense>
        <ShowParams />
      </Suspense>
    </div>
  );
}
