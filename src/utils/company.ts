import type { Company } from "@data/types";
import { isEmploymentType } from "@data/types";

let fallbackIdCounter = 0;

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

export function createUniqueId(prefix = "id"): string {
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;

  if (
    c &&
    typeof (c as unknown as { randomUUID?: () => string }).randomUUID ===
      "function"
  ) {
    return `${prefix}-${(c as unknown as { randomUUID: () => string }).randomUUID()}`;
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return `${prefix}-${bytesToHex(bytes)}`;
  }

  fallbackIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackIdCounter}`;
}

export function getActualLocations(locations: readonly string[]): string[] {
  return locations.filter((loc) => !isEmploymentType(loc));
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function createInterviewId(
  company: Pick<Company, "name" | "careersUrl">,
): string {
  const base = `${company.name}::${company.careersUrl ?? ""}`;
  return `interview-${Math.abs(hashString(base))}`;
}
