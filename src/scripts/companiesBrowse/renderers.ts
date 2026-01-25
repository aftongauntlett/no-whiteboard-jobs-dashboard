import type { Company } from "@data/types";
import {
  createInterviewId,
  createUniqueId,
  getActualLocations,
} from "../../utils/company";
import { employmentBadgeClasses } from "../../components/company/companyStyles";
import { cloneTemplateRoot } from "./templates";
import type { CompaniesBrowseTemplates } from "./templates";

function renderLocations(
  templates: CompaniesBrowseTemplates,
  container: HTMLElement,
  locations: readonly string[],
) {
  const actualLocations = getActualLocations(locations);
  container.replaceChildren();
  container.hidden = false;

  if (actualLocations.length === 0) {
    const chip = cloneTemplateRoot<HTMLElement>(templates["location-chip"]);
    chip.textContent = "No Location";
    chip.setAttribute("title", "No Location");
    chip.classList.add("location-chip--empty");
    container.append(chip);
    return;
  }

  const visible = actualLocations.slice(0, 1);
  const remaining = actualLocations.slice(1);

  for (const loc of visible) {
    const chip = cloneTemplateRoot<HTMLElement>(templates["location-chip"]);
    chip.textContent = loc;
    chip.setAttribute("title", loc);
    container.append(chip);
  }

  if (remaining.length > 0) {
    const btn = cloneTemplateRoot<HTMLButtonElement>(
      templates["location-overflow"],
    );

    const tooltipId = createUniqueId("locations-tooltip");
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
  interviewProcessHtml: string | null | undefined,
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
    const htmlTarget = textEl.querySelector("[data-company-interview-html]");
    if (htmlTarget instanceof HTMLElement) {
      htmlTarget.innerHTML = interviewProcessHtml ?? "";
    } else {
      textEl.innerHTML = interviewProcessHtml ?? "";
    }
  }

  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-controls", interviewId);
  }

  if (!interviewProcessHtml) {
    if (variant === "card") {
      if (textEl instanceof HTMLElement) {
        const htmlTarget = textEl.querySelector(
          "[data-company-interview-html]",
        );
        if (htmlTarget instanceof HTMLElement)
          htmlTarget.innerHTML = "<p>No details provided.</p>";
        else textEl.innerHTML = "<p>No details provided.</p>";
      }
      if (toggle instanceof HTMLButtonElement) {
        toggle.classList.add("hidden");
        toggle.setAttribute("aria-expanded", "false");
      }
      if (noInterview instanceof HTMLElement)
        noInterview.classList.add("hidden");
      interview.classList.remove("hidden");
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

function applySourceIndicator(
  root: ParentNode,
  source: Company["source"],
  curationStatus: Company["curationStatus"],
) {
  const el = root.querySelector("[data-company-source]");
  if (!(el instanceof HTMLElement)) return;

  const sr = root.querySelector("[data-company-source-sr]");
  const srEl = sr instanceof HTMLElement ? sr : null;

  const isLocal = source === "local";
  el.classList.toggle("hidden", !isLocal);
  if (srEl) srEl.classList.toggle("hidden", !isLocal);
  if (!isLocal) {
    if (srEl) srEl.textContent = "";
    return;
  }

  const status = curationStatus ?? "edited";
  const tooltip =
    status === "new"
      ? "New entry (added locally)"
      : "Edited entry (updated locally)";

  el.setAttribute("title", tooltip);
  if (srEl) srEl.textContent = tooltip;

  el.classList.remove("bg-success-bg", "bg-info-bg");

  if (status === "new") {
    el.classList.add("bg-success-bg");
  } else {
    el.classList.add("bg-info-bg");
  }
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

  applySourceIndicator(el, company.source, company.curationStatus);

  const locations = el.querySelectorAll("[data-company-locations]");
  for (const container of locations) {
    if (container instanceof HTMLElement) {
      renderLocations(templates, container, company.locations);
    }
  }

  const interviewId = createInterviewId(company);
  applyInterview(el, company.interviewProcessHtml, interviewId, "card");

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

  applySourceIndicator(el, company.source, company.curationStatus);

  const locations = el.querySelectorAll("[data-company-locations]");
  for (const container of locations) {
    if (container instanceof HTMLElement) {
      renderLocations(templates, container, company.locations);
    }
  }

  const interviewId = createInterviewId(company);
  applyInterview(el, company.interviewProcessHtml, interviewId, "list");

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
