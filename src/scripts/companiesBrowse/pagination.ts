import { generatePageNumbers } from "../../utils/pagination";
import { cloneTemplateRoot } from "./templates";
import type { CompaniesBrowseTemplates } from "./templates";

export function createPaginationNav(
  templates: CompaniesBrowseTemplates,
  currentPage: number,
  totalPages: number,
  onPage: (next: number) => void,
): HTMLElement {
  const nav = cloneTemplateRoot<HTMLElement>(templates["pagination-nav"]);

  const prev = nav.querySelector("[data-pagination-prev]");
  const next = nav.querySelector("[data-pagination-next]");
  const pagesWrap = nav.querySelector("[data-pagination-pages]");

  if (!(prev instanceof HTMLButtonElement)) {
    throw new Error("Missing pagination prev button");
  }
  if (!(next instanceof HTMLButtonElement)) {
    throw new Error("Missing pagination next button");
  }
  if (!(pagesWrap instanceof HTMLElement)) {
    throw new Error("Missing pagination pages container");
  }

  const setDisabled = (btn: HTMLButtonElement, disabled: boolean) => {
    btn.disabled = disabled;
    btn.classList.toggle("pagination-disabled", disabled);
  };

  setDisabled(prev, currentPage <= 1);
  setDisabled(next, currentPage >= totalPages);

  prev.onclick = () => onPage(currentPage - 1);
  next.onclick = () => onPage(currentPage + 1);

  for (const token of generatePageNumbers(currentPage, totalPages)) {
    if (token === "ellipsis") {
      pagesWrap.append(
        cloneTemplateRoot<HTMLElement>(templates["pagination-ellipsis"]),
      );
      continue;
    }

    if (token === currentPage) {
      const el = cloneTemplateRoot<HTMLElement>(
        templates["pagination-current"],
      );
      el.textContent = String(token);
      pagesWrap.append(el);
      continue;
    }

    const btn = cloneTemplateRoot<HTMLButtonElement>(
      templates["pagination-page"],
    );
    btn.textContent = String(token);
    btn.onclick = () => onPage(token);
    pagesWrap.append(btn);
  }

  return nav;
}
