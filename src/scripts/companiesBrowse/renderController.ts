import type { Company, EmploymentType } from "@data/types";

import type { InterviewTagId } from "../../config/interviewTags";

import { isMdUp } from "../../utils/viewMode";

import type { SortKey } from "./filters";
import { computeResults } from "./filters";
import { normalizeText } from "./text";
import { getView } from "./view";
import { updateUrl } from "./url";
import { createPaginationNav } from "./pagination";
import { initReadMore } from "./readMore";
import { renderCards, renderList } from "./renderers";
import type { CompaniesBrowseTemplates } from "./templates";

import type { BrowseState, IndexedCompany, MobilePagingState } from "./types";

export function createBrowseRenderController(args: {
  templates: CompaniesBrowseTemplates;
  indexedCompanies: IndexedCompany[];
  resultsCache: Map<string, Company[]>;

  cardPanel: HTMLElement;
  listPanel: HTMLElement;
  paginationHost: HTMLElement;
  fallbackPagination: HTMLElement | null;
  showMoreButton: HTMLButtonElement | null;

  perPageGroupCard: HTMLElement | null;
  perPageGroupList: HTMLElement | null;

  countEl: HTMLElement | null;
  menuButton: HTMLButtonElement | null;
  sortButtons: HTMLButtonElement[];
  perPageButtons: HTMLButtonElement[];
  employmentButtons: HTMLButtonElement[];

  selectedInterviewTags: Set<InterviewTagId>;

  selectedEmployment: Set<EmploymentType>;
  state: BrowseState;
  scrollToTop: () => void;
  closeMenu: () => void;
}) {
  const {
    templates,
    indexedCompanies,
    resultsCache,
    cardPanel,
    listPanel,
    paginationHost,
    fallbackPagination,
    showMoreButton,
    perPageGroupCard,
    perPageGroupList,
    countEl,
    menuButton,
    sortButtons,
    perPageButtons,
    employmentButtons,
    selectedInterviewTags,
    selectedEmployment,
    state,
    scrollToTop,
  } = args;

  if (fallbackPagination) fallbackPagination.style.display = "none";

  let lastTotalPages = 1;
  let mobilePagingState: MobilePagingState = "idle";

  const setShowMoreState = (next: MobilePagingState) => {
    if (!showMoreButton) return;
    mobilePagingState = next;

    if (next === "loading") {
      showMoreButton.textContent = "Loading…";
      showMoreButton.disabled = true;
      return;
    }

    if (next === "done") {
      showMoreButton.textContent = "All results loaded";
      showMoreButton.disabled = true;
      return;
    }

    showMoreButton.textContent = "Show more";
    showMoreButton.disabled = false;
  };

  const syncControls = () => {
    const view = getView();

    if (menuButton) {
      const filterDot = menuButton.querySelector<HTMLElement>(
        "[data-companies-active-filter-dot]",
      );
      const filters = [
        ...Array.from(selectedEmployment),
        ...Array.from(selectedInterviewTags),
      ];
      const hasFilters = filters.length > 0;
      if (filterDot) filterDot.classList.toggle("hidden", !hasFilters);

      // Optional a11y hint; does not indicate sort state.
      const a11yLabel = hasFilters
        ? `Filter & Sort (filters active: ${filters.join(", ")})`
        : "Filter & Sort";
      menuButton.setAttribute("aria-label", a11yLabel);
      menuButton.setAttribute("title", a11yLabel);
    }

    if (perPageGroupCard && perPageGroupList) {
      const showCard = view === "card";
      perPageGroupCard.classList.toggle("hidden", !showCard);
      perPageGroupCard.classList.toggle("inline-flex", showCard);
      perPageGroupCard.classList.toggle("items-center", showCard);

      const showList = view === "list";
      perPageGroupList.classList.toggle("hidden", !showList);
      perPageGroupList.classList.toggle("inline-flex", showList);
      perPageGroupList.classList.toggle("items-center", showList);
    }

    for (const btn of sortButtons) {
      const value = btn.getAttribute(
        "data-companies-sort-option",
      ) as SortKey | null;
      const active = value === state.sort;
      btn.setAttribute("aria-checked", active ? "true" : "false");
      const check = btn.querySelector<HTMLElement>(
        "[data-companies-sort-check]",
      );
      if (check) check.classList.toggle("hidden", !active);
      btn.classList.toggle("text-accent", active);
      btn.classList.toggle("bg-bg-light/60", active);
      btn.classList.toggle("dark:bg-bg-dark/30", active);
    }

    for (const btn of perPageButtons) {
      const value = Number.parseInt(
        btn.getAttribute("data-companies-per-page-option") ?? "",
        10,
      );
      const active = value === state.perPage;
      btn.setAttribute("aria-checked", active ? "true" : "false");
      btn.classList.toggle("bg-surface-light", active);
      btn.classList.toggle("dark:bg-surface-dark", active);
      btn.classList.toggle("text-text-light", active);
      btn.classList.toggle("dark:text-text-dark", active);
      btn.classList.toggle("text-text-mutedLight", !active);
      btn.classList.toggle("dark:text-text-mutedDark", !active);
    }

    for (const btn of employmentButtons) {
      const value = btn.getAttribute("data-companies-employment-option");
      const active = !!value && selectedEmployment.has(value as EmploymentType);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      const check = btn.querySelector<HTMLElement>(
        "[data-companies-employment-check]",
      );
      if (check) check.classList.toggle("hidden", !active);
      btn.classList.toggle("text-accent", active);
      btn.classList.toggle("bg-bg-light/60", active);
      btn.classList.toggle("dark:bg-bg-dark/30", active);
    }
  };

  const render = (options?: { append?: boolean }) => {
    const mdUp = isMdUp();
    const view = getView();

    const filtered = computeResults({
      indexed: indexedCompanies,
      query: normalizeText(state.query),
      sort: state.sort,
      selectedEmployment,
      selectedInterviewTags,
      resultsCache,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.perPage));

    lastTotalPages = totalPages;

    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const isMobilePaging = !mdUp;

    const startIndex = isMobilePaging ? 0 : (state.page - 1) * state.perPage;
    const endIndex = isMobilePaging
      ? Math.min(state.page * state.perPage, total)
      : Math.min(startIndex + state.perPage, total);

    const items = filtered.slice(startIndex, endIndex);

    if (countEl) {
      if (!total) {
        countEl.textContent = "No companies match your filters";
      } else if (isMobilePaging) {
        countEl.textContent = `Showing 1–${endIndex} of ${total} companies`;
      } else {
        countEl.textContent = `Showing ${startIndex + 1}–${endIndex} of ${total} companies`;
      }
    }

    if (view === "card") {
      if (isMobilePaging && options?.append) {
        const prevEnd = Math.min((state.page - 1) * state.perPage, total);
        const nextItems = filtered.slice(prevEnd, endIndex);
        renderCards({
          templates,
          host: cardPanel,
          companies: nextItems,
          append: true,
        });
      } else {
        renderCards({ templates, host: cardPanel, companies: items });
      }
    } else {
      renderList({ templates, host: listPanel, companies: items });
    }

    initReadMore(view === "card" ? cardPanel : listPanel);

    paginationHost.replaceChildren();
    if (mdUp) {
      if (total > 0 && totalPages > 1) {
        paginationHost.append(
          createPaginationNav(templates, state.page, totalPages, (nextPage) => {
            state.page = Math.max(1, Math.min(totalPages, nextPage));
            updateUrl({
              query: state.query,
              sort: state.sort,
              employment: Array.from(selectedEmployment),
              interview: Array.from(selectedInterviewTags),
              perPage: state.perPage,
              page: state.page,
            });
            render();
            scrollToTop();
          }),
        );
      }
    } else {
      const host = showMoreButton?.closest(
        "[data-companies-mobile-pagination]",
      );
      if (!showMoreButton) {
        // no-op
      } else if (total === 0) {
        host?.classList.add("hidden");
      } else {
        host?.classList.remove("hidden");
        if (state.page >= totalPages) setShowMoreState("done");
        else setShowMoreState("idle");
      }
    }

    updateUrl({
      query: state.query,
      sort: state.sort,
      employment: Array.from(selectedEmployment),
      interview: Array.from(selectedInterviewTags),
      perPage: state.perPage,
      page: state.page,
    });

    syncControls();
  };

  const resetMobilePaging = () => {
    mobilePagingState = "idle";
    setShowMoreState("idle");
  };

  return {
    render,
    syncControls,
    setShowMoreState,
    resetMobilePaging,
    getLastTotalPages: () => lastTotalPages,
    getMobilePagingState: () => mobilePagingState,
  };
}
