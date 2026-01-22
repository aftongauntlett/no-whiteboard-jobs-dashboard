import type { Company, EmploymentType } from "@data/types";
import { isEmploymentType } from "@data/types";
import companies from "../../data/companies.json";

import { MD_QUERY, isMdUp, qs, qsa } from "./dom";
import { normalizeText } from "./text";
import type { SortKey } from "./filters";
import { computeResults } from "./filters";
import { getView } from "./view";
import {
  defaultPerPageForView,
  nearestOption,
  perPageOptionsForView,
} from "./paginationConfig";
import { readInitialPageFromPath, updateUrl } from "./url";
import { getCompaniesBrowseTemplates } from "./templates";
import { createPaginationNav } from "./pagination";
import { initReadMore } from "./readMore";
import { renderCards, renderList } from "./renderers";

type IndexedCompany = {
  company: Company;
  searchText: string;
};

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

  // Sort/filter dropdown behavior
  const menuRoot = qs<HTMLElement>(section, "[data-companies-menu]");
  const menuScrim = qs<HTMLElement>(section, "[data-companies-menu-scrim]");
  const menuButton = qs<HTMLButtonElement>(
    section,
    "[data-companies-menu-button]",
  );
  const menuPanel = qs<HTMLElement>(section, "[data-companies-menu-panel]");

  const setMenuOpen = (open: boolean) => {
    if (!menuButton || !menuPanel) return;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuPanel.classList.toggle("hidden", !open);
    if (menuScrim) menuScrim.classList.toggle("hidden", !open);

    if (open) {
      const firstInteractive = qs<HTMLElement>(
        menuPanel,
        "[data-companies-sort-option], [data-companies-employment-option], [data-companies-reset]",
      );
      firstInteractive?.focus();
    }
  };

  if (menuButton && menuPanel) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      setMenuOpen(false);
      menuButton.focus();
    });

    document.addEventListener("click", (e) => {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRoot && menuRoot.contains(target)) return;
      setMenuOpen(false);
    });
  }

  if (menuScrim) {
    menuScrim.addEventListener("click", () => {
      setMenuOpen(false);
      menuButton?.focus();
    });
  }

  // Canonicalize /page/N to / for enhanced browsing.
  const initialPathPage = readInitialPageFromPath();
  if (initialPathPage && window.location.pathname.startsWith("/page/")) {
    const next = new URL(window.location.href);
    if (!next.searchParams.get("page")) {
      next.searchParams.set("page", String(initialPathPage));
    }
    next.pathname = "/";
    window.history.replaceState({}, "", next);
  }

  const params = new URL(window.location.href).searchParams;

  const initialView = getView();

  let query = params.get("q") ?? "";

  let sort: SortKey = (params.get("sort") as SortKey) ?? "name-asc";
  if (!(["name-asc", "name-desc", "employment"] as const).includes(sort)) {
    sort = "name-asc";
  }

  const selectedEmployment = new Set<EmploymentType>();
  const typesParam = params.get("employment") ?? "";
  for (const t of typesParam.split(",").map((s) => s.trim())) {
    if (isEmploymentType(t)) selectedEmployment.add(t);
  }

  const perPageDefault = defaultPerPageForView(initialView);
  const perPageAllowed = perPageOptionsForView(initialView);
  const perPageParam = Number.parseInt(
    params.get("perPage") ?? String(perPageDefault),
    10,
  );

  let perPage = perPageAllowed.includes(perPageParam)
    ? perPageParam
    : nearestOption(
        Number.isFinite(perPageParam) ? perPageParam : perPageDefault,
        perPageAllowed,
      );

  if (!isMdUp()) {
    const mobileMax = 24;
    const mobileAllowed = perPageAllowed.filter((n) => n <= mobileMax);
    const mobileCap =
      mobileAllowed.length > 0
        ? Math.max(...mobileAllowed)
        : defaultPerPageForView(initialView);
    if (perPage > mobileCap) perPage = mobileCap;
  }

  const pageParam = Number.parseInt(params.get("page") ?? "1", 10);
  let page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

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

  const paginationHost = clientPaginationHost;

  if (fallbackPagination) fallbackPagination.style.display = "none";

  if (searchInput) searchInput.value = query;

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

  const syncControls = () => {
    const view = getView();

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
      const active = value === sort;
      btn.setAttribute("aria-checked", active ? "true" : "false");
      const check = qs<HTMLElement>(btn, "[data-companies-sort-check]");
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
      const active = value === perPage;
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
      const active = isEmploymentType(value) && selectedEmployment.has(value);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      const check = qs<HTMLElement>(btn, "[data-companies-employment-check]");
      if (check) check.classList.toggle("hidden", !active);
      btn.classList.toggle("text-accent", active);
      btn.classList.toggle("bg-bg-light/60", active);
      btn.classList.toggle("dark:bg-bg-dark/30", active);
    }
  };

  let lastTotalPages = 1;
  let mobilePagingState: "idle" | "loading" | "done" = "idle";

  const setShowMoreState = (state: "idle" | "loading" | "done") => {
    if (!showMoreButton) return;
    mobilePagingState = state;

    if (state === "loading") {
      showMoreButton.textContent = "Loading…";
      showMoreButton.disabled = true;
      return;
    }

    if (state === "done") {
      showMoreButton.textContent = "All results loaded";
      showMoreButton.disabled = true;
      return;
    }

    showMoreButton.textContent = "Show more";
    showMoreButton.disabled = false;
  };

  const render = (options?: { append?: boolean }) => {
    const mdUp = isMdUp();
    const view = getView();

    const filtered = computeResults({
      indexed: indexedCompanies,
      query: normalizeText(query),
      sort,
      selectedEmployment,
      resultsCache,
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    lastTotalPages = totalPages;

    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    const isMobilePaging = !mdUp;

    const startIndex = isMobilePaging ? 0 : (page - 1) * perPage;
    const endIndex = isMobilePaging
      ? Math.min(page * perPage, total)
      : Math.min(startIndex + perPage, total);

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
        const prevEnd = Math.min((page - 1) * perPage, total);
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
          createPaginationNav(templates, page, totalPages, (nextPage) => {
            page = Math.max(1, Math.min(totalPages, nextPage));
            updateUrl({
              query,
              sort,
              employment: Array.from(selectedEmployment),
              perPage,
              page,
            });
            render();
            scrollToTop();
          }),
        );
      }
    } else {
      if (!showMoreButton) {
        // no-op
      } else if (total === 0) {
        showMoreButton
          .closest("[data-companies-mobile-pagination]")
          ?.classList.add("hidden");
      } else {
        showMoreButton
          .closest("[data-companies-mobile-pagination]")
          ?.classList.remove("hidden");
        if (page >= totalPages) setShowMoreState("done");
        else setShowMoreState("idle");
      }
    }

    updateUrl({
      query,
      sort,
      employment: Array.from(selectedEmployment),
      perPage,
      page,
    });

    syncControls();
  };

  syncControls();

  const mdMq = window.matchMedia(MD_QUERY);
  let lastMdUp = mdMq.matches;
  const onMdChange = (e: MediaQueryListEvent) => {
    const nowMdUp = e.matches;
    if (nowMdUp === lastMdUp) return;
    lastMdUp = nowMdUp;

    if (!nowMdUp) {
      mobilePagingState = "idle";
      setShowMoreState("idle");
      page = 1;
    }

    render();
  };
  mdMq.addEventListener("change", onMdChange);

  if (searchInput) {
    const SEARCH_DEBOUNCE_MS = 175;
    let debounceId: number | null = null;

    const schedule = () => {
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        debounceId = null;
        query = searchInput.value;
        page = 1;
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
      if (
        (["name-asc", "name-desc", "employment"] as const).includes(next as any)
      ) {
        sort = next as SortKey;
      } else {
        sort = "name-asc";
      }
      page = 1;
      render();
      setMenuOpen(false);
    });
  }

  for (const btn of perPageButtons) {
    btn.addEventListener("click", () => {
      const next = Number.parseInt(
        btn.getAttribute("data-companies-per-page-option") ?? "",
        10,
      );
      const view = getView();
      const allowed = perPageOptionsForView(view);
      if (!Number.isFinite(next)) return;
      if (!allowed.includes(next)) return;
      perPage = next;
      page = 1;
      render();
    });
  }

  for (const btn of employmentButtons) {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-companies-employment-option");
      if (!isEmploymentType(raw)) return;
      const value = raw;
      if (selectedEmployment.has(value)) selectedEmployment.delete(value);
      else selectedEmployment.add(value);
      page = 1;
      render();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      query = "";
      sort = "name-asc";
      selectedEmployment.clear();
      perPage = defaultPerPageForView(getView());
      page = 1;

      if (searchInput) searchInput.value = "";
      render();
      setMenuOpen(false);
    });
  }

  if (showMoreButton) {
    showMoreButton.addEventListener("click", () => {
      if (isMdUp()) return;
      if (mobilePagingState === "loading") return;
      if (page >= lastTotalPages) {
        setShowMoreState("done");
        return;
      }

      setShowMoreState("loading");

      window.requestAnimationFrame(() => {
        page = Math.min(lastTotalPages, page + 1);
        render({ append: true });
      });
    });
  }

  for (const btn of qsa<HTMLElement>(section, "[data-companies-view-button]")) {
    btn.addEventListener("click", () => {
      const view = getView();
      const allowed = perPageOptionsForView(view);
      if (!allowed.includes(perPage)) {
        perPage = nearestOption(perPage, allowed);
      }
      render();
    });
  }

  render();
}

export function deferredInit() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(init, { timeout: 2000 });
  } else {
    setTimeout(init, 1);
  }
}
