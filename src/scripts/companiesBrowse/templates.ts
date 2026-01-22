export type TemplateKey =
  | "card-interactive"
  | "card-static"
  | "list-interactive"
  | "list-static"
  | "location-chip"
  | "location-overflow"
  | "pagination-nav"
  | "pagination-page"
  | "pagination-current"
  | "pagination-ellipsis";

export type CompaniesBrowseTemplates = Record<TemplateKey, HTMLTemplateElement>;

function getTemplate(root: ParentNode, key: TemplateKey): HTMLTemplateElement {
  const el = root.querySelector(
    `[data-companies-template="${key}"]`,
  ) as HTMLTemplateElement | null;
  if (!el) throw new Error(`Missing template: ${key}`);
  return el;
}

export function getCompaniesBrowseTemplates(
  root: ParentNode,
): CompaniesBrowseTemplates {
  return {
    "card-interactive": getTemplate(root, "card-interactive"),
    "card-static": getTemplate(root, "card-static"),
    "list-interactive": getTemplate(root, "list-interactive"),
    "list-static": getTemplate(root, "list-static"),
    "location-chip": getTemplate(root, "location-chip"),
    "location-overflow": getTemplate(root, "location-overflow"),
    "pagination-nav": getTemplate(root, "pagination-nav"),
    "pagination-page": getTemplate(root, "pagination-page"),
    "pagination-current": getTemplate(root, "pagination-current"),
    "pagination-ellipsis": getTemplate(root, "pagination-ellipsis"),
  };
}

export function cloneTemplateRoot<T extends Element>(
  tpl: HTMLTemplateElement,
): T {
  const first = tpl.content.firstElementChild;
  if (!first) throw new Error("Template has no root element");
  return first.cloneNode(true) as T;
}
