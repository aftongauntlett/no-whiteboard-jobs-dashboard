import type { Company } from "@data/types";
import companies from "../data/companies.json";

type SortKey = "name-asc" | "name-desc" | "employment";

type EmploymentType = Company["employmentType"];

type ViewMode = "card" | "list";

const EMPLOYMENT_ORDER: Record<EmploymentType, number> = {
  Remote: 0,
  Hybrid: 1,
  "In-office": 2,
};

const STORAGE_VIEW_KEY = "companies-view";

function qs<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector(selector) as T | null;
}

function qsa<T extends Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function readInitialPageFromPath(): number | null {
  const match = window.location.pathname.match(/\/page\/(\d+)\/?$/);
  if (!match) return null;
  const num = Number.parseInt(match[1]!, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function getView(): "card" | "list" {
  try {
    const value = localStorage.getItem(STORAGE_VIEW_KEY);
    return value === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

function perPageOptionsForView(view: ViewMode): number[] {
  return view === "card" ? [12, 24, 48, 96] : [10, 25, 50, 100];
}

function defaultPerPageForView(view: ViewMode): number {
  return view === "card" ? 24 : 25;
}

function nearestOption(value: number, options: number[]): number {
  if (options.length === 0) return value;
  let best = options[0]!;
  let bestDelta = Math.abs(value - best);
  for (const opt of options) {
    const delta = Math.abs(value - opt);
    if (delta < bestDelta || (delta === bestDelta && opt < best)) {
      best = opt;
      bestDelta = delta;
    }
  }
  return best;
}

function generatePageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  const pages: Array<number | "ellipsis"> = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badgeClasses(type: EmploymentType): string {
  const base = "ui-badge";

  if (type === "Remote") {
    return `${base} bg-info-bg/20 text-info-text`;
  }

  if (type === "Hybrid") {
    return `${base} bg-warning-bg/20 text-warning-text`;
  }

  return `${base} bg-success-bg/20 text-success-text`;
}

function locationChipHtml(location: string): string {
  return `<span class="location-chip">${escapeHtml(location)}</span>`;
}

function locationOverflowHtml(remaining: string[]): string {
  const tooltipId = `locations-tooltip-${crypto.randomUUID()}`;
  const count = remaining.length;
  const label = `Show ${count} more location${count === 1 ? "" : "s"}`;

  return `
<button
  type="button"
  class="location-chip group/loc relative z-30 hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-accent"
  aria-label="${escapeHtml(label)}"
  aria-describedby="${tooltipId}"
>
  +${count}
  <div
    id="${tooltipId}"
    role="tooltip"
    class="absolute top-0 left-full ml-2 invisible group-hover/loc:visible group-focus/loc:visible group-focus-within/loc:visible pointer-events-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 text-xs text-text-light dark:text-text-dark shadow-lg ring-1 ring-black/5 dark:ring-white/10 max-w-104 z-10 text-left"
  >
    <div class="flex flex-col space-y-1">
      ${remaining.map((loc) => `<span>${escapeHtml(loc)}</span>`).join("")}
    </div>
  </div>
</button>`.trim();
}

function externalLinkIconHtml(): string {
  return `
<span class="inline-flex h-8 w-8 items-center justify-center rounded-md text-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
    <path d="M14 3h7v7" />
    <path d="M10 14L21 3" />
    <path d="M21 14v7h-7" />
    <path d="M3 10v11h11" />
  </svg>
</span>`.trim();
}

function companyCardHtml(company: Company): string {
  const employment = `<span class="${badgeClasses(company.employmentType)}">${escapeHtml(
    company.employmentType,
  )}</span>`;

  const locations = company.locations.filter(
    (loc) => loc !== "Remote" && loc !== "Hybrid" && loc !== "In-office",
  );

  const locationBits: string[] = [];
  if (locations.length > 0) {
    locationBits.push(locationChipHtml(locations[0]!));
    if (locations.length > 1) {
      locationBits.push(locationOverflowHtml(locations.slice(1)));
    }
  } else {
    locationBits.push(
      '<span class="location-chip text-text-mutedLight dark:text-text-mutedDark">Not Available</span>',
    );
  }

  const interviewId = `interview-${crypto.randomUUID()}`;
  const interview = company.interviewProcess
    ? `<div class="relative z-30 mt-3">
        <p id="${interviewId}" data-readmore-text data-readmore-clamp="line-clamp-4" class="text-sm text-text-mutedLight dark:text-text-mutedDark group-hover:text-text-light dark:group-hover:text-text-dark group-focus-within:text-text-light dark:group-focus-within:text-text-dark transition-colors line-clamp-4">${escapeHtml(
          company.interviewProcess,
        )}</p>
        <div class="text-right">
          <button type="button" data-readmore-toggle class="mt-1 hidden text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded" aria-expanded="false" aria-controls="${interviewId}">Read more</button>
        </div>
      </div>`
    : "";

  if (!company.careersUrl) {
    return `
  <article class="company-card group">
  <header class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex items-center gap-2">
      <h3 class="text-base font-semibold leading-tight text-text-light dark:text-text-dark min-w-0"><span>${escapeHtml(
        company.name,
      )}</span></h3>
      <div class="shrink-0">${employment}</div>
    </div>
  </header>

  <div class="mt-1 flex flex-wrap gap-2" aria-label="Company locations">${locationBits.join(
    "",
  )}</div>

  ${interview}
</article>`.trim();
  }

  return `
<article class="company-card company-card--interactive group relative focus-within:ring-2 focus-within:ring-accent/30 focus-within:ring-offset-2 focus-within:ring-offset-bg-light dark:focus-within:ring-offset-bg-dark">
  <a href="${escapeHtml(
    company.careersUrl,
  )}" target="_blank" rel="noopener noreferrer" class="absolute inset-0 z-20 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" aria-label="Open ${escapeHtml(
    company.name,
  )} careers page in a new tab"></a>

  <div class="relative flex flex-col">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex items-center gap-2">
        <h3 class="text-base font-semibold leading-tight text-text-light dark:text-text-dark min-w-0">
          <span class="group-hover:text-accent">${escapeHtml(
            company.name,
          )}</span>
        </h3>
        <div class="shrink-0">${employment}</div>
      </div>

      <div class="shrink-0">${externalLinkIconHtml()}</div>
    </header>

    <div class="mt-1 flex flex-wrap gap-2" aria-label="Company locations">${locationBits.join(
      "",
    )}</div>

    ${interview}
  </div>
</article>`.trim();
}

function companyListItemHtml(company: Company): string {
  const locations = company.locations.filter(
    (loc) => loc !== "Remote" && loc !== "Hybrid" && loc !== "In-office",
  );

  const maxVisibleLocations = 1;

  const notAvailableChip =
    '<span class="location-chip text-text-mutedLight dark:text-text-mutedDark">Not Available</span>';

  const locationBits: string[] = [];
  if (locations.length > 0) {
    const visible = locations.slice(0, maxVisibleLocations);
    const remaining = locations.slice(maxVisibleLocations);
    for (const loc of visible) locationBits.push(locationChipHtml(loc));
    if (remaining.length > 0)
      locationBits.push(locationOverflowHtml(remaining));
  } else {
    locationBits.push(notAvailableChip);
  }

  const employment = `<span class="${badgeClasses(company.employmentType)}">${escapeHtml(
    company.employmentType,
  )}</span>`;

  const name = `<span class="block whitespace-nowrap truncate group-hover:text-accent group-focus-within:text-accent">${escapeHtml(
    company.name,
  )}</span>`;

  const interviewId = `interview-${crypto.randomUUID()}`;
  const interview = company.interviewProcess
    ? `<div class="relative z-30">
        <p id="${interviewId}" data-readmore-text data-readmore-clamp="line-clamp-3" class="text-xs sm:text-sm text-text-mutedLight dark:text-text-mutedDark group-hover:text-text-light dark:group-hover:text-text-dark group-focus-within:text-text-light dark:group-focus-within:text-text-dark line-clamp-3">${escapeHtml(
          company.interviewProcess,
        )}</p>
        <div class="text-right">
          <button type="button" data-readmore-toggle class="mt-1 hidden text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded" aria-expanded="false" aria-controls="${interviewId}">Read more</button>
        </div>
      </div>`
    : `<div class="relative z-30"><p class="text-xs text-text-mutedLight dark:text-text-mutedDark group-hover:text-text-light dark:group-hover:text-text-dark group-focus-within:text-text-light dark:group-focus-within:text-text-dark">No interview notes provided.</p></div>`;

  const locationsCell = `<div aria-label="Company locations">
    <div class="flex items-start">${employment}</div>
    <div class="mt-2 flex flex-wrap items-center gap-2">${locationBits.join(
      "",
    )}</div>
  </div>`;

  if (!company.careersUrl) {
    return `
<li class="company-list-item group relative px-4 py-3 pr-12 sm:px-5 sm:py-4 sm:pr-14 md:pr-5 transition-colors md:col-span-4 md:grid md:grid-cols-subgrid md:gap-x-4 md:items-start">
    <div class="grid grid-cols-1 gap-3 md:contents">
    <div class="min-w-0">
      <h3 class="min-w-0 text-sm font-semibold leading-snug text-text-light dark:text-text-dark">${name}</h3>
    </div>

    <div class="min-w-0 md:border-l-2 md:border-border-light/80 dark:md:border-border-dark/80 md:pl-4">${locationsCell}</div>

    <div class="min-w-0 md:border-l-2 md:border-border-light/80 dark:md:border-border-dark/80 md:pl-4 md:max-w-prose md:justify-self-start">${interview}</div>

    <div class="z-30 absolute right-4 top-3 sm:right-5 sm:top-4 md:static md:justify-self-end md:self-start">
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-mutedLight dark:text-text-mutedDark opacity-50" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7h-7" />
          <path d="M3 10v11h11" />
        </svg>
      </span>
    </div>
  </div>
</li>`.trim();
  }

  return `
<li class="company-list-item group relative px-4 py-3 pr-12 sm:px-5 sm:py-4 sm:pr-14 md:pr-5 transition-colors md:col-span-4 md:grid md:grid-cols-subgrid md:gap-x-4 md:items-start">
  <a href="${escapeHtml(
    company.careersUrl,
  )}" target="_blank" rel="noopener noreferrer" class="absolute inset-0 z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-light dark:focus-visible:ring-offset-bg-dark" aria-label="Open ${escapeHtml(
    company.name,
  )} careers page in a new tab"></a>

  <div class="grid grid-cols-1 gap-3 md:contents">
    <div class="min-w-0">
      <h3 class="min-w-0 text-sm font-semibold leading-snug text-text-light dark:text-text-dark">${name}</h3>
    </div>

    <div class="min-w-0 md:border-l-2 md:border-border-light/80 dark:md:border-border-dark/80 md:pl-4">${locationsCell}</div>

    <div class="min-w-0 md:border-l-2 md:border-border-light/80 dark:md:border-border-dark/80 md:pl-4 md:max-w-prose md:justify-self-start">${interview}</div>

    <div class="z-30 absolute right-4 top-3 sm:right-5 sm:top-4 md:static md:justify-self-end md:self-start">
      <a href="${escapeHtml(
        company.careersUrl,
      )}" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" aria-label="Open ${escapeHtml(
        company.name,
      )} careers page in a new tab">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7h-7" />
          <path d="M3 10v11h11" />
        </svg>
      </a>
    </div>
  </div>
</li>`.trim();
}

function createPaginationNav(
  currentPage: number,
  totalPages: number,
  onPage: (next: number) => void,
): HTMLElement {
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Pagination");
  nav.className =
    "mt-6 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3 flex items-center justify-center gap-2";

  const makeButton = (
    label: string,
    disabled: boolean,
    onClick: () => void,
  ) => {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = label;
    el.className =
      "pagination-button" + (disabled ? " pagination-disabled" : "");
    el.disabled = disabled;
    el.addEventListener("click", onClick);
    return el;
  };

  nav.append(
    makeButton("← Previous", currentPage <= 1, () => onPage(currentPage - 1)),
  );

  const pagesWrap = document.createElement("div");
  pagesWrap.className = "flex items-center gap-1";

  for (const p of generatePageNumbers(currentPage, totalPages)) {
    if (p === "ellipsis") {
      const span = document.createElement("span");
      span.textContent = "…";
      span.className = "pagination-ellipsis";
      span.setAttribute("aria-hidden", "true");
      pagesWrap.append(span);
      continue;
    }

    if (p === currentPage) {
      const span = document.createElement("span");
      span.textContent = String(p);
      span.className = "pagination-current";
      span.setAttribute("aria-current", "page");
      pagesWrap.append(span);
      continue;
    }

    pagesWrap.append(
      makeButton(String(p), false, () => {
        onPage(p);
      }),
    );
  }

  nav.append(pagesWrap);

  nav.append(
    makeButton("Next →", currentPage >= totalPages, () =>
      onPage(currentPage + 1),
    ),
  );

  return nav;
}

function init() {
  const section = document.getElementById("companies");
  if (!section) return;

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  // Sort/filter dropdown behavior
  const menuRoot = qs<HTMLElement>(section, "[data-companies-menu]");
  const menuScrim = qs<HTMLElement>(section, "[data-companies-menu-scrim]");
  const menuButton = qs<HTMLButtonElement>(
    section,
    "[data-companies-menu-button]",
  );
  const menuPanel = qs<HTMLElement>(section, "[data-companies-menu-panel]");

  function setMenuOpen(open: boolean) {
    if (!menuButton || !menuPanel) return;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuPanel.classList.toggle("hidden", !open);
    if (menuScrim) menuScrim.classList.toggle("hidden", !open);

    if (open) {
      const firstFocusable = qs<HTMLElement>(
        menuPanel,
        "input, button, [href], select, textarea",
      );
      firstFocusable?.focus();
    }
  }

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
    if (t === "Remote" || t === "Hybrid" || t === "In-office") {
      selectedEmployment.add(t);
    }
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

  const perPageGroupCard = qs<HTMLElement>(
    section,
    '[data-companies-per-page-group="card"]',
  );
  const perPageGroupList = qs<HTMLElement>(
    section,
    '[data-companies-per-page-group="list"]',
  );

  const resetButton = qs<HTMLButtonElement>(section, "[data-companies-reset]");

  const employmentButtons = qsa<HTMLButtonElement>(
    section,
    "[data-companies-employment-option]",
  );

  const fallbackPagination = qs<HTMLElement>(
    section,
    "[data-companies-fallback-pagination]",
  );
  const clientPaginationHost = qs<HTMLElement>(
    section,
    "[data-companies-client-pagination]",
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

  const cardGrid = cardPanel;
  const listWrap = listPanel;
  const paginationHost = clientPaginationHost;

  // Hide the static pagination once JS is active.
  if (fallbackPagination) fallbackPagination.classList.add("hidden");

  if (searchInput) searchInput.value = query;

  function syncControls() {
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
      btn.classList.toggle("bg-surface-light", active);
      btn.classList.toggle("dark:bg-surface-dark", active);
      btn.classList.toggle("text-text-light", active);
      btn.classList.toggle("dark:text-text-dark", active);
      btn.classList.toggle("text-text-mutedLight", !active);
      btn.classList.toggle("dark:text-text-mutedDark", !active);
    }

    for (const btn of employmentButtons) {
      const value = btn.getAttribute(
        "data-companies-employment-option",
      ) as EmploymentType | null;
      const active = !!value && selectedEmployment.has(value);
      btn.setAttribute("aria-checked", active ? "true" : "false");
      const check = qs<HTMLElement>(btn, "[data-companies-employment-check]");
      if (check) check.classList.toggle("hidden", !active);
      btn.classList.toggle("text-accent", active);
      btn.classList.toggle("bg-bg-light/60", active);
      btn.classList.toggle("dark:bg-bg-dark/30", active);
    }
  }

  function initReadMore(root: ParentNode) {
    const textEls = qsa<HTMLElement>(root, "[data-readmore-text]");
    for (const textEl of textEls) {
      const container = textEl.parentElement;
      if (!container) continue;
      const btn = qs<HTMLButtonElement>(container, "[data-readmore-toggle]");
      if (!btn) continue;

      const clampClass =
        textEl.getAttribute("data-readmore-clamp") || "line-clamp-3";

      const setExpanded = (expanded: boolean) => {
        btn.setAttribute("aria-expanded", expanded ? "true" : "false");
        btn.textContent = expanded ? "Read less" : "Read more";
        if (expanded) {
          textEl.classList.remove(clampClass);
          textEl.classList.add("line-clamp-none");
        } else {
          textEl.classList.remove("line-clamp-none");
          textEl.classList.add(clampClass);
        }
      };

      const updateVisibility = () => {
        // Only show the control if clamped text actually overflows.
        const isOverflowing = textEl.scrollHeight - textEl.clientHeight > 1;
        btn.classList.toggle("hidden", !isOverflowing);
      };

      // Reset to collapsed on each render.
      setExpanded(false);

      // Defer measurement until layout is settled.
      queueMicrotask(updateVisibility);
      window.requestAnimationFrame(updateVisibility);

      btn.onclick = (e) => {
        e.preventDefault();
        const expanded = btn.getAttribute("aria-expanded") === "true";
        setExpanded(!expanded);
      };
    }
  }

  syncControls();

  function updateUrl() {
    const next = new URL(window.location.href);
    next.pathname = "/";

    if (query.trim()) next.searchParams.set("q", query.trim());
    else next.searchParams.delete("q");

    next.searchParams.set("sort", sort);

    if (selectedEmployment.size > 0) {
      next.searchParams.set(
        "employment",
        Array.from(selectedEmployment).join(","),
      );
    } else {
      next.searchParams.delete("employment");
    }

    next.searchParams.set("perPage", String(perPage));
    next.searchParams.set("page", String(page));

    window.history.replaceState({}, "", next);
  }

  function computeResults(all: Company[]) {
    const q = normalizeText(query);

    let result = all;

    if (selectedEmployment.size > 0) {
      result = result.filter((c) => selectedEmployment.has(c.employmentType));
    }

    if (q) {
      result = result.filter((c) => {
        const haystack = normalizeText(
          [
            c.name,
            c.employmentType,
            ...(c.locations ?? []),
            c.interviewProcess ?? "",
          ].join(" "),
        );
        return haystack.includes(q);
      });
    }

    const sorted = [...result];

    sorted.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);

      // employment
      const ea = EMPLOYMENT_ORDER[a.employmentType];
      const eb = EMPLOYMENT_ORDER[b.employmentType];
      if (ea !== eb) return ea - eb;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }

  function render() {
    const view = getView();
    const all = companies as Company[];

    const filtered = computeResults(all);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, total);
    const items = filtered.slice(startIndex, endIndex);

    if (countEl) {
      countEl.textContent = total
        ? `Showing ${startIndex + 1}–${endIndex} of ${total} companies`
        : "No companies match your filters";
    }

    // Render cards/list content
    if (view === "card") {
      cardGrid.innerHTML = items.map(companyCardHtml).join("");
    } else {
      listWrap.innerHTML = `
<ul class="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark md:grid md:gap-x-4 md:items-start md:grid-cols-[fit-content(18rem)_minmax(0,12rem)_minmax(0,1fr)_2.5rem]" aria-label="Companies">
  ${items.map(companyListItemHtml).join("")}
</ul>`.trim();
    }

    initReadMore(view === "card" ? cardGrid : listWrap);

    // Pagination
    paginationHost.innerHTML = "";
    if (total > 0 && totalPages > 1) {
      paginationHost.append(
        createPaginationNav(page, totalPages, (next) => {
          page = Math.max(1, Math.min(totalPages, next));
          updateUrl();
          render();
          scrollToTop();
        }),
      );
    }

    updateUrl();
    syncControls();
  }

  // Events
  if (searchInput) {
    const handler = () => {
      query = searchInput.value;
      page = 1;
      render();
    };
    searchInput.addEventListener("input", handler);
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
      const value = btn.getAttribute(
        "data-companies-employment-option",
      ) as EmploymentType | null;
      if (!value) return;
      if (selectedEmployment.has(value)) {
        selectedEmployment.delete(value);
      } else {
        selectedEmployment.add(value);
      }
      page = 1;
      render();
    });
  }

  if (menuScrim) {
    menuScrim.addEventListener("click", () => {
      setMenuOpen(false);
      menuButton?.focus();
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

  // Re-render when view toggle changes (buttons live outside this script)
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

function deferredInit() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(init, { timeout: 2000 });
  } else {
    setTimeout(init, 1);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", deferredInit, { once: true });
} else {
  deferredInit();
}
