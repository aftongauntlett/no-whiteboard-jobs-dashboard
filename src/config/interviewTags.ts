export type InterviewTagDefinition = {
  id: string;
  label: string;
  matcher: RegExp;
};

/**
 * Heuristic “Interview style” tags derived from a company's interview process text.
 *
 * Notes:
 * - These are keyword/regex matches (best-effort), not a normalized taxonomy.
 * - Changing matchers may change historical tagging for existing entries.
 */
export const interviewTags = [
  {
    id: "take-home",
    label: "Take-home",
    matcher:
      /take[- ]?home|assignment|coding exercise|homework|offline project|project\b/i,
  },
  {
    id: "live-coding",
    label: "Live coding",
    matcher:
      /live coding|coding session|shared editor|replit|coderpad|hackerrank live|codesignal live/i,
  },
  {
    id: "pair-programming",
    label: "Pair programming",
    matcher:
      /pair programming|pairing|paired|collaborative coding|work session/i,
  },
  {
    id: "system-design",
    label: "System design",
    matcher:
      /system design|architecture|design interview|technical design|scalability/i,
  },
  {
    id: "behavioral",
    label: "Behavioral",
    matcher: /behavioral|culture|values|soft skills|leadership|team fit/i,
  },
  {
    id: "portfolio-review",
    label: "Portfolio review",
    matcher:
      /portfolio|past projects|resume walk[- ]?through|code review|open source/i,
  },
  {
    id: "technical-discussion",
    label: "Technical discussion",
    matcher: /technical discussion|deep dive|q&a|tradeoffs|design discussion/i,
  },
  {
    id: "async",
    label: "Async",
    matcher: /async|asynchronous|offline|email screening|written/i,
  },
  {
    id: "time-boxed",
    label: "Time-boxed",
    matcher: /timebox|time-box|timed|90 minutes|2 hours|60 minutes/i,
  },
  {
    id: "on-site",
    label: "On-site",
    matcher: /on[- ]?site|onsite|in person|in-person|office/i,
  },
] as const satisfies readonly InterviewTagDefinition[];

export type InterviewTagId = (typeof interviewTags)[number]["id"];

const INTERVIEW_TAG_ID_SET = new Set<string>(interviewTags.map((t) => t.id));

export function isInterviewTagId(value: unknown): value is InterviewTagId {
  return INTERVIEW_TAG_ID_SET.has(String(value));
}
