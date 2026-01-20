type CompaniesView = "card" | "list";

const STORAGE_KEY = "companies-view";

function getStoredView(): CompaniesView {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

function setStoredView(view: CompaniesView) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // ignore
  }
}

function applyView(root: HTMLElement, next: CompaniesView) {
  const cardPanel = root.querySelector<HTMLElement>(
    '[data-companies-view-panel="card"]',
  );
  const listPanel = root.querySelector<HTMLElement>(
    '[data-companies-view-panel="list"]',
  );
  const buttons = Array.from(
    root.querySelectorAll<HTMLElement>("[data-companies-view-button]"),
  );

  if (!cardPanel || !listPanel) return;

  root.setAttribute("data-companies-view", next);
  cardPanel.classList.toggle("hidden", next !== "card");
  listPanel.classList.toggle("hidden", next !== "list");

  for (const btn of buttons) {
    const btnView = btn.getAttribute(
      "data-companies-view-button",
    ) as CompaniesView | null;
    const active = btnView === next;

    btn.setAttribute("aria-checked", active ? "true" : "false");

    btn.classList.toggle("bg-bg-light", active);
    btn.classList.toggle("dark:bg-bg-dark", active);
    btn.classList.toggle("text-accent", active);
  }

  setStoredView(next);
}

function init() {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-companies-view]"),
  );
  if (roots.length === 0) return;

  const initial = getStoredView();

  for (const root of roots) {
    applyView(root, initial);

    const buttons = Array.from(
      root.querySelectorAll<HTMLElement>("[data-companies-view-button]"),
    );

    for (const btn of buttons) {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute(
          "data-companies-view-button",
        ) as CompaniesView | null;
        applyView(root, view === "list" ? "list" : "card");
      });
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
