#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const README_URL =
  "https://raw.githubusercontent.com/poteto/hiring-without-whiteboards/main/README.md";
const DATA_FILE = new URL("../src/data/companies.json", import.meta.url);

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");

function normalizeUrl(url) {
  if (typeof url !== "string") return "";

  let value = url.trim();
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";

    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    let path = parsed.pathname.replace(/\/$/, "");
    if (path === "") path = "/";

    return `${host}${path.toLowerCase()}`;
  } catch {
    return value
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function slugifyName(name) {
  const base = String(name ?? "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-+/g, "-");

  return base || "company";
}

function parseLocations(rawLocations) {
  return String(rawLocations)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function inferEmploymentType(locations) {
  return locations.some((loc) => /\bremote\b/i.test(loc))
    ? "Remote"
    : "In-office";
}

function parseReadmeRows(readmeText) {
  const lines = readmeText.split(/\r?\n/);
  const logicalRows = [];

  let currentRow = "";
  for (const line of lines) {
    if (line.startsWith("- [")) {
      if (currentRow) logicalRows.push(currentRow);
      currentRow = line.trim();
      continue;
    }

    if (!currentRow) continue;

    if (line.trim() === "") {
      logicalRows.push(currentRow);
      currentRow = "";
      continue;
    }

    currentRow = `${currentRow} ${line.trim()}`;
  }

  if (currentRow) {
    logicalRows.push(currentRow);
  }

  const rows = [];
  const rowPrefixRegex = /^- \[(.+?)\]\((https?:\/\/[^)]+)\) \| (.+)$/;

  for (const row of logicalRows) {
    const match = row.match(rowPrefixRegex);
    if (!match) continue;

    const [, name, careersUrl, trailingColumns] = match;
    const separatorIndex = trailingColumns.indexOf("|");

    const locationCell =
      separatorIndex === -1
        ? trailingColumns.trim()
        : trailingColumns.slice(0, separatorIndex).trim();
    const interviewProcessCell =
      separatorIndex === -1
        ? ""
        : trailingColumns.slice(separatorIndex + 1).trim();

    rows.push({
      name: name.trim(),
      careersUrl: careersUrl.trim(),
      locationCell,
      interviewProcessCell,
    });
  }

  return rows;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function companiesEqual(a, b) {
  return (
    a.name === b.name &&
    a.careersUrl === b.careersUrl &&
    a.employmentType === b.employmentType &&
    (a.interviewProcess ?? "") === (b.interviewProcess ?? "") &&
    arraysEqual(a.locations, b.locations)
  );
}

function pushToIndexMap(map, key, value) {
  const current = map.get(key);
  if (current) {
    current.push(value);
  } else {
    map.set(key, [value]);
  }
}

function takeUnused(candidates, usedIndexes) {
  if (!candidates || candidates.length === 0) return null;

  for (const candidate of candidates) {
    if (!usedIndexes.has(candidate.index)) {
      return candidate;
    }
  }

  return null;
}

function buildSyncedCompanies(upstreamRows, localCompanies) {
  const localWithMeta = localCompanies.map((company, index) => ({
    company,
    index,
    keyUrl: normalizeUrl(company.careersUrl),
    keyName: normalizeName(company.name),
  }));

  const byUrl = new Map();
  const byName = new Map();
  for (const entry of localWithMeta) {
    pushToIndexMap(byUrl, entry.keyUrl, entry);
    pushToIndexMap(byName, entry.keyName, entry);
  }

  const usedIndexes = new Set();
  const existingIds = new Set(localCompanies.map((company) => company.id));

  function nextUniqueId(name) {
    const base = slugifyName(name);
    if (!existingIds.has(base)) {
      existingIds.add(base);
      return base;
    }

    let counter = 2;
    while (existingIds.has(`${base}-${counter}`)) {
      counter += 1;
    }

    const id = `${base}-${counter}`;
    existingIds.add(id);
    return id;
  }

  const synced = [];
  let createdCount = 0;
  let updatedCount = 0;

  for (const row of upstreamRows) {
    const urlKey = normalizeUrl(row.careersUrl);
    const nameKey = normalizeName(row.name);

    const source =
      takeUnused(byUrl.get(urlKey), usedIndexes) ??
      takeUnused(byName.get(nameKey), usedIndexes);

    const locations = parseLocations(row.locationCell);
    const next = {
      id: source ? source.company.id : nextUniqueId(row.name),
      name: row.name,
      careersUrl: row.careersUrl,
      locations,
      employmentType: inferEmploymentType(locations),
      interviewProcess: row.interviewProcessCell,
    };

    if (source) {
      usedIndexes.add(source.index);

      if (!companiesEqual(source.company, next)) {
        updatedCount += 1;
      }
    } else {
      createdCount += 1;
    }

    synced.push(next);
  }

  const removed = localWithMeta
    .filter((entry) => !usedIndexes.has(entry.index))
    .map((entry) => entry.company);

  return {
    synced,
    createdCount,
    removedCount: removed.length,
    updatedCount,
    removed,
  };
}

function printSummary(summary) {
  console.log(`Upstream rows: ${summary.upstreamCount}`);
  console.log(`Local rows: ${summary.localCount}`);
  console.log(`Would create: ${summary.createdCount}`);
  console.log(`Would remove: ${summary.removedCount}`);
  console.log(`Would update: ${summary.updatedCount}`);

  if (summary.removed.length > 0) {
    console.log("\nEntries that would be removed:");
    for (const company of summary.removed) {
      console.log(`- ${company.id} | ${company.name} | ${company.careersUrl}`);
    }
  }
}

async function main() {
  const response = await fetch(README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch upstream README: ${response.status}`);
  }

  const readme = await response.text();
  const upstreamRows = parseReadmeRows(readme);
  if (upstreamRows.length === 0) {
    throw new Error("Parsed zero company rows from upstream README.");
  }

  const local = JSON.parse(await readFile(DATA_FILE, "utf8"));
  if (!Array.isArray(local)) {
    throw new Error("Expected src/data/companies.json to be an array.");
  }

  const result = buildSyncedCompanies(upstreamRows, local);
  const summary = {
    upstreamCount: upstreamRows.length,
    localCount: local.length,
    ...result,
  };

  if (checkOnly) {
    printSummary(summary);

    const hasChanges =
      summary.createdCount > 0 ||
      summary.removedCount > 0 ||
      summary.updatedCount > 0;

    if (hasChanges) {
      process.exitCode = 1;
      console.error("\nUpstream parity check failed.");
    } else {
      console.log("\nUpstream parity check passed.");
    }

    return;
  }

  const hasChanges =
    summary.createdCount > 0 ||
    summary.removedCount > 0 ||
    summary.updatedCount > 0;

  await writeFile(DATA_FILE, `${JSON.stringify(result.synced, null, 2)}\n`);
  printSummary(summary);

  if (hasChanges) {
    console.log("\nUpdated src/data/companies.json from upstream README.");
  } else {
    console.log("\nLocal data already matches upstream README.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
