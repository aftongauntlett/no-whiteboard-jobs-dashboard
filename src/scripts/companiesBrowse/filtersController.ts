import type { EmploymentType } from "@data/types";
import { isEmploymentType } from "@data/types";

import type { InterviewTagId } from "../../config/interviewTags";
import { isInterviewTagId } from "../../config/interviewTags";

import type { SortKey } from "./filters";
import type { BrowseState } from "./types";

const SORT_KEYS = [
  "name-asc",
  "name-desc",
  "curated-desc",
] as const satisfies readonly SortKey[];

function isSortKey(value: string | null): value is SortKey {
  if (!value) return false;
  return (SORT_KEYS as readonly string[]).includes(value);
}

export function bindFiltersController(args: {
  searchInput: HTMLInputElement | null;
  sortButtons: HTMLButtonElement[];
  employmentInputs: HTMLInputElement[];
  interviewTagInputs: HTMLInputElement[];
  resetButton: HTMLButtonElement | null;

  selectedEmployment: Set<EmploymentType>;
  selectedInterviewTags: Set<InterviewTagId>;
  state: BrowseState;

  render: () => void;
  closeMenu: () => void;
  setSearchValue?: (value: string) => void;
  onReset?: () => void;
}) {
  const {
    searchInput,
    sortButtons,
    employmentInputs,
    interviewTagInputs,
    resetButton,
    selectedEmployment,
    selectedInterviewTags,
    state,
    render,
    closeMenu,
    onReset,
  } = args;

  if (searchInput) {
    const SEARCH_DEBOUNCE_MS = 175;
    let debounceId: number | null = null;

    const schedule = () => {
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        debounceId = null;
        state.query = searchInput.value;
        state.page = 1;
        render();
      }, SEARCH_DEBOUNCE_MS);
    };

    searchInput.addEventListener("input", schedule);

    resetButton?.addEventListener("click", () => {
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = null;
    });
  }

  for (const btn of sortButtons) {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute(
        "data-companies-sort-option",
      ) as SortKey | null;
      state.sort = isSortKey(next) ? next : "name-asc";
      state.page = 1;
      render();
      closeMenu();
    });
  }

  for (const input of employmentInputs) {
    const raw = input.value;
    if (!isEmploymentType(raw)) continue;
    const value = raw;

    // Sync initial checked state from URL.
    input.checked = selectedEmployment.has(value);

    input.addEventListener("change", () => {
      if (input.checked) selectedEmployment.add(value);
      else selectedEmployment.delete(value);
      state.page = 1;
      render();
    });
  }

  for (const input of interviewTagInputs) {
    const raw = input.value;
    if (!isInterviewTagId(raw)) continue;
    const value = raw as InterviewTagId;

    // Sync initial checked state from URL.
    input.checked = selectedInterviewTags.has(value);

    input.addEventListener("change", () => {
      if (input.checked) selectedInterviewTags.add(value);
      else selectedInterviewTags.delete(value);
      state.page = 1;
      render();
    });
  }

  resetButton?.addEventListener("click", () => {
    onReset?.();
  });
}
