import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
if (!JSEARCH_API_KEY) {
  throw new Error(
    "Missing required environment variable: JSEARCH_API_KEY\n" +
      "Set it before running: JSEARCH_API_KEY=<your-key> node scripts/fetch-jobs.mjs",
  );
}

const BASE_URL = "https://jsearch.p.rapidapi.com/search";
const HEADERS = {
  "X-RapidAPI-Key": JSEARCH_API_KEY,
  "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
};

async function fetchJobs(query) {
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "3",
    date_posted: "week",
  });

  const url = `${BASE_URL}?${params}`;
  const response = await fetch(url, { headers: HEADERS });

  if (!response.ok) {
    throw new Error(
      `JSearch API request failed for query "${query}": ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveEmploymentType(job) {
  if (job.job_is_remote) return "Remote";
  const type = (job.job_employment_type || "").toUpperCase();
  if (type.includes("HYBRID")) return "Hybrid";
  return "On-site";
}

function deriveLocations(job) {
  if (job.job_is_remote) return ["Remote"];
  const parts = [job.job_city, job.job_state].filter(Boolean);
  return parts.length > 0 ? [parts.join(", ")] : ["Unknown"];
}

function normalize(job, fetchedAt) {
  // Truncate description to avoid bloating the JSON — we only need enough
  // text for keyword matching and display.
  const description = (job.job_description ?? "").slice(0, 2000).trim();

  return {
    id: slugify(job.job_id),
    name: job.employer_name ?? "",
    jobTitle: job.job_title ?? "",
    careersUrl: job.job_apply_link ?? "",
    locations: deriveLocations(job),
    employmentType: deriveEmploymentType(job),
    interviewProcess: description || undefined,
    source: "jsearch",
    postedAt: job.job_posted_at_datetime_utc ?? "",
    fetchedAt,
  };
}

const queries = [
  "frontend engineer remote",
  "software engineer remote no leetcode",
  "full stack developer remote",
];

const fetchedAt = new Date().toISOString();

const results = await Promise.all(queries.map(fetchJobs));
const merged = results.flat();

// Deduplicate by job_apply_link
const seen = new Set();
const deduped = merged.filter((job) => {
  const key = job.job_apply_link;
  if (!key || seen.has(key)) return false;
  seen.add(key);
  return true;
});

const normalized = deduped.map((job) => normalize(job, fetchedAt));

const outPath = join(__dirname, "../src/data/jobs.live.json");
writeFileSync(outPath, JSON.stringify(normalized, null, 2), "utf-8");

console.log(
  `Wrote ${normalized.length} job records to src/data/jobs.live.json`,
);
