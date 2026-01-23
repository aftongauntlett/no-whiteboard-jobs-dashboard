import type { EmploymentType } from "@data/types";
import { isEmploymentType } from "@data/types";

import type { SortKey } from "./filters";
import type { BrowseState } from "./types";

const SORT_KEYS = [
  "name-asc",
  "name-desc",
  "last-updated",
] as const satisfies readonly SortKey[];

function isSortKey(value: string | null): value is SortKey {
  if (!value) return false;
  return (SORT_KEYS as readonly string[]).includes(value);
}

export function bindFiltersController(args: {
  searchInput: HTMLInputElement | null;
  sortButtons: HTMLButtonElement[];
  employmentButtons: HTMLButtonElement[];
  resetButton: HTMLButtonElement | null;

  selectedEmployment: Set<EmploymentType>;
  state: BrowseState;

  render: () => void;
  closeMenu: () => void;
  setSearchValue?: (value: string) => void;
  onReset?: () => void;
}) {
  const {
    searchInput,
    sortButtons,
    employmentButtons,
    resetButton,
    selectedEmployment,
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

  for (const btn of employmentButtons) {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-companies-employment-option");
      if (!isEmploymentType(raw)) return;
      const value = raw;
      if (selectedEmployment.has(value)) selectedEmployment.delete(value);
      else selectedEmployment.add(value);
      state.page = 1;
      render();
    });
  }

  resetButton?.addEventListener("click", () => {
    onReset?.();
  });
}
