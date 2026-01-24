import type { Company } from "../data/types";
import { interviewTags } from "../config/interviewTags";
import type { InterviewTagId } from "../config/interviewTags";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function deriveInterviewTagsFromText(
  text: string | null | undefined,
): InterviewTagId[] {
  const input = (text ?? "").trim();
  if (!input) return [];

  const output: InterviewTagId[] = [];
  for (const tag of interviewTags) {
    if (tag.matcher.test(input)) output.push(tag.id);
  }
  return output;
}

/**
 * Derives “Interview style” tags from `company.interviewProcess`.
 *
 * Safe defaults:
 * - Missing/empty text => []
 *
 * Note: client-side browsing does not ship raw markdown for upstream entries;
 * in that context we fall back to stripping `interviewProcessHtml`.
 */
export function deriveInterviewTags(
  company: Pick<Company, "interviewProcess" | "interviewProcessHtml">,
): InterviewTagId[] {
  const text =
    company.interviewProcess ?? stripHtml(company.interviewProcessHtml ?? "");
  return deriveInterviewTagsFromText(text);
}
