import type { Company } from "@data/types";
import { isEmploymentType } from "@data/types";

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
