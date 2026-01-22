import type { Company, EmploymentType } from "@data/types";
import { createInterviewId, getActualLocations } from "../../utils/company";
import { cloneTemplateRoot } from "./templates";
import type { CompaniesBrowseTemplates } from "./templates";

function employmentBadgeClasses(type: EmploymentType): string {
  const base = "ui-badge";
  if (type === "Remote") return `${base} bg-info-bg/20 text-info-text`;
  if (type === "Hybrid") return `${base} bg-warning-bg/20 text-warning-text`;
  return `${base} bg-success-bg/20 text-success-text`;
}

function renderLocations(
  templates: CompaniesBrowseTemplates,
  container: HTMLElement,
  locations: readonly string[],
) {
  const actualLocations = getActualLocations(locations);
  container.replaceChildren();

  if (actualLocations.length === 0) {
    const chip = cloneTemplateRoot<HTMLElement>(templates["location-chip"]);
    chip.textContent = "Not Available";
    chip.classList.add("text-text-mutedLight", "dark:text-text-mutedDark");
    container.append(chip);
    return;
  }

  const visible = actualLocations.slice(0, 1);
  const remaining = actualLocations.slice(1);

  for (const loc of visible) {
    const chip = cloneTemplateRoot<HTMLElement>(templates["location-chip"]);
    chip.textContent = loc;
    container.append(chip);
  }

  if (remaining.length > 0) {
    const btn = cloneTemplateRoot<HTMLButtonElement>(
      templates["location-overflow"],
    );

    const tooltipId = `locations-tooltip-${crypto.randomUUID()}`;
    const count = remaining.length;
    const label = `Show ${count} more location${count === 1 ? "" : "s"}`;

    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-describedby", tooltipId);

    const countEl = btn.querySelector("[data-location-overflow-count]");
    if (countEl) countEl.textContent = `+${count}`;

    const tooltip = btn.querySelector("[data-location-overflow-tooltip]");
    if (tooltip instanceof HTMLElement) tooltip.id = tooltipId;

    const items = btn.querySelector("[data-location-overflow-items]");
    if (items instanceof HTMLElement) {
      items.replaceChildren(
        ...remaining.map((loc) => {
          const span = document.createElement("span");
          span.textContent = loc;
          return span;
        }),
      );
    }

    container.append(btn);
  }
}

function applyInterview(
  root: ParentNode,
  interviewProcess: string | null | undefined,
  interviewId: string,
  variant: "card" | "list",
) {
  const interview = root.querySelector("[data-company-interview]");
  const noInterview = root.querySelector("[data-company-no-interview]");

  if (!(interview instanceof HTMLElement)) return;

  const textEl = interview.querySelector("[data-company-interview-text]");
  const toggle = interview.querySelector("[data-company-interview-toggle]");

  if (textEl instanceof HTMLElement) {
    textEl.id = interviewId;
    textEl.textContent = interviewProcess ?? "";
  }

  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-controls", interviewId);
  }

  if (!interviewProcess) {
    if (variant === "card") {
      interview.remove();
      return;
    }

    interview.classList.add("hidden");
    if (noInterview instanceof HTMLElement)
      noInterview.classList.remove("hidden");
    return;
  }

  interview.classList.remove("hidden");
  if (noInterview instanceof HTMLElement) noInterview.classList.add("hidden");
}

export function createCompanyCardElement(
  templates: CompaniesBrowseTemplates,
  company: Company,
): HTMLElement {
  const tplKey = company.careersUrl ? "card-interactive" : "card-static";
  const el = cloneTemplateRoot<HTMLElement>(templates[tplKey]);

  const name = el.querySelector("[data-company-name]");
  if (name instanceof HTMLElement) name.textContent = company.name;

  const employment = el.querySelector("[data-company-employment]");
  if (employment instanceof HTMLElement) {
    employment.className = employmentBadgeClasses(company.employmentType);
    employment.textContent = company.employmentType;
  }

  const locations = el.querySelector("[data-company-locations]");
  if (locations instanceof HTMLElement) {
    renderLocations(templates, locations, company.locations);
  }

  const interviewId = createInterviewId(company);
  applyInterview(el, company.interviewProcess, interviewId, "card");

  if (company.careersUrl) {
    const link = el.querySelector("[data-company-link]");
    if (link instanceof HTMLAnchorElement) {
      link.href = company.careersUrl;
      link.setAttribute(
        "aria-label",
        `Open ${company.name} careers page in a new tab`,
      );
    }
  }

  return el;
}

export function createCompanyListItemElement(
  templates: CompaniesBrowseTemplates,
  company: Company,
): HTMLElement {
  const tplKey = company.careersUrl ? "list-interactive" : "list-static";
  const el = cloneTemplateRoot<HTMLElement>(templates[tplKey]);

  const name = el.querySelector("[data-company-name]");
  if (name instanceof HTMLElement) name.textContent = company.name;

  const employment = el.querySelector("[data-company-employment]");
  if (employment instanceof HTMLElement) {
    employment.className = employmentBadgeClasses(company.employmentType);
    employment.textContent = company.employmentType;
  }

  const locations = el.querySelector("[data-company-locations]");
  if (locations instanceof HTMLElement) {
    renderLocations(templates, locations, company.locations);
  }

  const interviewId = createInterviewId(company);
  applyInterview(el, company.interviewProcess, interviewId, "list");

  if (company.careersUrl) {
    const link = el.querySelector("[data-company-link]");
    if (link instanceof HTMLAnchorElement) {
      link.href = company.careersUrl;
      link.setAttribute(
        "aria-label",
        `Open ${company.name} careers page in a new tab`,
      );
    }

    const action = el.querySelector("[data-company-action-link]");
    if (action instanceof HTMLAnchorElement) {
      action.href = company.careersUrl;
      action.setAttribute(
        "aria-label",
        `Open ${company.name} careers page in a new tab`,
      );
    }

    const disabled = el.querySelector("[data-company-action-disabled]");
    if (disabled instanceof HTMLElement) disabled.classList.add("hidden");
  }

  return el;
}

export function renderCards(args: {
  templates: CompaniesBrowseTemplates;
  host: HTMLElement;
  companies: Company[];
  append?: boolean;
}) {
  const nodes = args.companies.map((c) =>
    createCompanyCardElement(args.templates, c),
  );
  if (args.append) {
    args.host.append(...nodes);
  } else {
    args.host.replaceChildren(...nodes);
  }
}

export function renderList(args: {
  templates: CompaniesBrowseTemplates;
  host: HTMLElement;
  companies: Company[];
}) {
  const ul = args.host.querySelector("ul");
  if (!(ul instanceof HTMLUListElement)) return;

  ul.replaceChildren(
    ...args.companies.map((c) =>
      createCompanyListItemElement(args.templates, c),
    ),
  );
}
