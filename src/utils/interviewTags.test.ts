import test from "node:test";
import assert from "node:assert/strict";

import { deriveInterviewTagsFromText } from "./interviewTags";

test("deriveInterviewTagsFromText: empty => []", () => {
  assert.deepEqual(deriveInterviewTagsFromText(""), []);
  assert.deepEqual(deriveInterviewTagsFromText(undefined), []);
  assert.deepEqual(deriveInterviewTagsFromText(null), []);
});

test("deriveInterviewTagsFromText: take-home + system-design", () => {
  const tags = deriveInterviewTagsFromText(
    "Timeboxed design exercise and related coding exercise, followed by a system design interview.",
  );
  assert(tags.includes("take-home"));
  assert(tags.includes("system-design"));
  assert(tags.includes("time-boxed"));
});

test("deriveInterviewTagsFromText: async + take-home", () => {
  const tags = deriveInterviewTagsFromText(
    "Email screening process, followed by a take-home assignment",
  );
  assert(tags.includes("async"));
  assert(tags.includes("take-home"));
});

test("deriveInterviewTagsFromText: on-site + pair-programming", () => {
  const tags = deriveInterviewTagsFromText(
    "Take home project, then a pair programming session onsite",
  );
  assert(tags.includes("take-home"));
  assert(tags.includes("pair-programming"));
  assert(tags.includes("on-site"));
});

test("deriveInterviewTagsFromText: live-coding", () => {
  const tags = deriveInterviewTagsFromText(
    "Live coding in a shared editor (CoderPad) with an engineer",
  );
  assert(tags.includes("live-coding"));
});
