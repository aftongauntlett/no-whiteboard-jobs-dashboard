import type { Company } from "@data/types";
import { clientCompanies } from "../../data/companies";

import { qs, qsa } from "./dom";
import { normalizeText } from "./text";
import { getView } from "./view";
import { getBrowseDefaults } from "./defaults";
import { getCompaniesBrowseTemplates } from "./templates";

import { createCompaniesMenuController } from "./menu";
import { canonicalizePagePath, readInitialStateFromUrl } from "./urlState";
import { createBrowseRenderController } from "./renderController";
import { bindFiltersController } from "./filtersController";
import { bindPaginationController } from "./paginationController";
import type { BrowseState, IndexedCompany } from "./types";

import { interviewTags } from "../../config/interviewTags";
import { deriveInterviewTagsFromText } from "../../utils/interviewTags";
import { AI_KEYWORDS_RE } from "./filters";

function init() {
  const section = document.getElementById("companies");
  if (!section) return;

  // Bind menu interactions early so the Filter button works even if later
  // initialization steps fail (e.g. missing templates).
  const menu = createCompaniesMenuController(section);

  let templates: ReturnType<typeof getCompaniesBrowseTemplates>;
  try {
    templates = getCompaniesBrowseTemplates(section);
  } catch (err) {
    console.error("Companies browse init failed (missing templates)", err);
    return;
  }

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

  canonicalizePagePath();

  const initialView = getView();
  const initial = readInitialStateFromUrl(initialView);

  const state: BrowseState = {
    query: initial.query,
    sort: initial.sort,
    selectedEmployment: initial.selectedEmployment,
    selectedInterviewTags: initial.selectedInterviewTags,
    aiFriendly: initial.aiFriendly,
    hasInterviewDetails: initial.hasInterviewDetails,
    perPage: initial.perPage,
    page: initial.page,
  };

  const countEl = qs<HTMLElement>(section, "[data-companies-count]");
  const searchInput = qs<HTMLInputElement>(section, "[data-companies-search]");
  const menuButton = qs<HTMLButtonElement>(
    section,
    "[data-companies-menu-button]",
  );

  const sortButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-sort-option]",
  );
  const perPageButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-per-page-option]",
  );
  const resetButton = qs<HTMLButtonElement>(section, "[data-companies-reset]");
  const employmentInputs = qsa<HTMLInputElement>(
    section,
    "[data-companies-employment-option]",
  );

  const interviewTagInputs = qsa<HTMLInputElement>(
    section,
    "[data-companies-interview-tag]",
  );

  const aiFriendlyInput = qs<HTMLInputElement>(
    section,
    "[data-companies-ai-friendly]",
  );

  const hasInterviewDetailsInput = qs<HTMLInputElement>(
    section,
    "[data-companies-has-interview-details]",
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

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ");

  const allCompanies = clientCompanies as Company[];
  const indexedCompanies: IndexedCompany[] = allCompanies.map((c) => ({
    company: c,
    searchText: normalizeText(
      [
        c.name,
        c.employmentType,
        ...(c.locations ?? []),
        stripHtml(c.interviewProcessHtml ?? ""),
      ].join(" "),
    ),
    interviewTags: deriveInterviewTagsFromText(
      stripHtml(c.interviewProcessHtml ?? ""),
    ),
  }));

  const cssEscape = (value: string) => {
    if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
      return globalThis.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  };

  // Counts are computed from the full dataset (before any filters).
  const interviewCounts = new Map<string, number>();
  for (const tag of interviewTags) interviewCounts.set(tag.id, 0);
  for (const c of indexedCompanies) {
    for (const id of c.interviewTags) {
      interviewCounts.set(id, (interviewCounts.get(id) ?? 0) + 1);
    }
  }
  for (const tag of interviewTags) {
    const el = section.querySelector<HTMLElement>(
      `[data-companies-interview-count="${cssEscape(tag.id)}"]`,
    );
    if (el) el.textContent = String(interviewCounts.get(tag.id) ?? 0);
  }

  // Employment type counts
  const employmentCounts = new Map<string, number>();
  for (const c of indexedCompanies) {
    const t = c.company.employmentType;
    employmentCounts.set(t, (employmentCounts.get(t) ?? 0) + 1);
  }
  for (const [type, count] of employmentCounts) {
    const el = section.querySelector<HTMLElement>(
      `[data-companies-employment-count="${cssEscape(type)}"]`,
    );
    if (el) el.textContent = String(count);
  }

  // AI-friendly count
  const aiFriendlyCount = indexedCompanies.filter((c) => {
    if (c.company.source === "jsearch") return true;
    const text = (c.company.interviewProcessHtml ?? "").replace(/<[^>]*>/g, " ");
    return AI_KEYWORDS_RE.test(text);
  }).length;
  const aiFriendlyCountEl = section.querySelector<HTMLElement>(
    "[data-companies-ai-friendly-count]",
  );
  if (aiFriendlyCountEl) aiFriendlyCountEl.textContent = String(aiFriendlyCount);

  // Has interview details count
  const hasInterviewCount = indexedCompanies.filter((c) => {
    const text = (c.company.interviewProcessHtml ?? "").replace(/<[^>]*>/g, " ").trim();
    return text !== "" && text !== "No details provided.";
  }).length;
  const hasInterviewCountEl = section.querySelector<HTMLElement>(
    "[data-companies-has-interview-count]",
  );
  if (hasInterviewCountEl) hasInterviewCountEl.textContent = String(hasInterviewCount);

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
    menuButton,
    sortButtons,
    perPageButtons,
    employmentInputs,
    selectedInterviewTags: state.selectedInterviewTags,
    selectedEmployment: state.selectedEmployment,
    state,
    scrollToTop,
    closeMenu: menu.close,
  });

  bindFiltersController({
    searchInput,
    sortButtons,
    employmentInputs,
    interviewTagInputs,
    aiFriendlyInput,
    hasInterviewDetailsInput,
    resetButton,
    selectedEmployment: state.selectedEmployment,
    selectedInterviewTags: state.selectedInterviewTags,
    state,
    render: () => renderer.render(),
    closeMenu: menu.close,
    onReset: () => {
      const d = getBrowseDefaults(getView());
      state.query = d.query;
      state.sort = d.sort;
      state.selectedEmployment.clear();
      state.selectedInterviewTags.clear();
      state.aiFriendly = d.aiFriendly;
      state.hasInterviewDetails = d.hasInterviewDetails;
      state.perPage = d.perPage;
      state.page = d.page;
      if (searchInput) searchInput.value = d.query;
      for (const input of interviewTagInputs) input.checked = false;
      if (aiFriendlyInput) aiFriendlyInput.checked = false;
      if (hasInterviewDetailsInput) hasInterviewDetailsInput.checked = false;
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
