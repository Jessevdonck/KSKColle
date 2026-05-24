import { mutate as swrGlobalMutate } from "swr";
import { CLASS_ORDER } from "./constants";

export const createUrlFriendlyName = (voornaam: string, achternaam: string) =>
  `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_");

export const isJesseVaerendonck = (voornaam?: string, achternaam?: string) =>
  (voornaam || "").trim().toLowerCase() === "jesse" &&
  (achternaam || "").trim().toLowerCase() === "vaerendonck";

export const getDisplayedTeamPlayerCount = (actualCount: number) =>
  actualCount > 10 ? 10 : actualCount;

export async function revalidateMegaschaakAfterTeamChange() {
  await swrGlobalMutate(
    (key) =>
      typeof key === "string" && /^megaschaak\/team\/\d+\/details$/.test(key),
    undefined,
    { revalidate: true },
  );
}

export function sortClassEntries<T extends [string, unknown]>(
  entries: T[],
): T[] {
  return [...entries].sort(([a], [b]) => {
    const aIndex = CLASS_ORDER.indexOf(a as (typeof CLASS_ORDER)[number]);
    const bIndex = CLASS_ORDER.indexOf(b as (typeof CLASS_ORDER)[number]);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}
