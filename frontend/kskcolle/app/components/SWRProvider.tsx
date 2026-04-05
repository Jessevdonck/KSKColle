"use client";

import { SWRConfig } from "swr";
import { DEFAULT_SWR_OPTIONS } from "@/lib/swrConfig";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ ...DEFAULT_SWR_OPTIONS }}>{children}</SWRConfig>
  );
}
