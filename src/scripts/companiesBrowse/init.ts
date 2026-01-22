import type { Company } from "@data/types";
import companies from "../../data/companies";

import { qs, qsa } from "./dom";
import { normalizeText } from "./text";
import { getView } from "./view";
import { defaultPerPageForView } from "./paginationConfig";
import { getCompaniesBrowseTemplates } from "./templates";

import { createCompaniesMenuController } from "./menu";
import { canonicalizePagePath, readInitialStateFromUrl } from "./urlState";
import { createBrowseRenderController } from "./renderController";
import { bindFiltersController } from "./filtersController";
import { bindPaginationController } from "./paginationController";
import type { BrowseState, IndexedCompany } from "./types";

function init() {
  const section = document.getElementById("companies");
  if (!section) return;

  const templates = getCompaniesBrowseTemplates(section);

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const menu = createCompaniesMenuController(section);

  canonicalizePagePath();

  const initialView = getView();
  const initial = readInitialStateFromUrl(initialView);

  const state: BrowseState = {
    query: initial.query,
    sort: initial.sort,
    selectedEmployment: initial.selectedEmployment,
    perPage: initial.perPage,
    page: initial.page,
  };

  const countEl = qs<HTMLElement>(section, "[data-companies-count]");
  const searchInput = qs<HTMLInputElement>(section, "[data-companies-search]");

  const sortButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-sort-option]",
  );
  const perPageButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-per-page-option]",
  );
  const resetButton = qs<HTMLButtonElement>(section, "[data-companies-reset]");
  const employmentButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-employment-option]",
  );

  const perPageGroupCard = qs<HTMLElement>(
    section,
    '[data-companies-per-page-group="card"]',
  );
  const perPageGroupList = qs<HTMLElement>(
    section,
    '[data-companies-per-page-group="list"]',
  );

  const fallbackPagination = qs<HTMLElement>(
    section,
    "[data-companies-fallback-pagination]",
  );
  const clientPaginationHost = qs<HTMLElement>(
    section,
    "[data-companies-client-pagination]",
  );
  const showMoreButton = qs<HTMLButtonElement>(
    section,
    "[data-companies-show-more]",
  );

  const cardPanel = qs<HTMLElement>(
    section,
    '[data-companies-view-panel="card"]',
  );
  const listPanel = qs<HTMLElement>(
    section,
    '[data-companies-view-panel="list"]',
  );

  if (!cardPanel || !listPanel || !clientPaginationHost) return;

  if (searchInput) searchInput.value = state.query;

  const allCompanies = companies as Company[];
  const indexedCompanies: IndexedCompany[] = allCompanies.map((c) => ({
    company: c,
    searchText: normalizeText(
      [
        c.name,
        c.employmentType,
        ...(c.locations ?? []),
        c.interviewProcess ?? "",
      ].join(" "),
    ),
  }));

  const resultsCache = new Map<string, Company[]>();

  const renderer = createBrowseRenderController({
    templates,
    indexedCompanies,
    resultsCache,
    cardPanel,
    listPanel,
    paginationHost: clientPaginationHost,
    fallbackPagination,
    showMoreButton,
    perPageGroupCard,
    perPageGroupList,
    countEl,
    sortButtons,
    perPageButtons,
    employmentButtons,
    selectedEmployment: state.selectedEmployment,
    state,
    scrollToTop,
    closeMenu: menu.close,
  });

  bindFiltersController({
    searchInput,
    sortButtons,
    employmentButtons,
    resetButton,
    selectedEmployment: state.selectedEmployment,
    state,
    render: () => renderer.render(),
    closeMenu: menu.close,
    onReset: () => {
      state.query = "";
      state.sort = "name-asc";
      state.selectedEmployment.clear();
      state.perPage = defaultPerPageForView(getView());
      state.page = 1;
      if (searchInput) searchInput.value = "";
      renderer.render();
      menu.close();
    },
  });

  bindPaginationController({
    section,
    perPageButtons,
    showMoreButton,
    state,
    render: (options) => renderer.render(options),
    getLastTotalPages: renderer.getLastTotalPages,
    getMobilePagingState: renderer.getMobilePagingState,
    setShowMoreState: renderer.setShowMoreState,
    resetMobilePaging: renderer.resetMobilePaging,
  });

  renderer.syncControls();
  renderer.render();
}

export function deferredInit() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(init, { timeout: 2000 });
  } else {
    setTimeout(init, 1);
  }
}
