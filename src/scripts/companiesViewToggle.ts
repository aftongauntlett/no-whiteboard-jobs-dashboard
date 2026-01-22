import {
  MD_QUERY,
  isMdUp,
  VIEW_MODE_STORAGE_KEY,
  type ViewMode,
} from "../utils/viewMode";

function getStoredView(): ViewMode {
  try {
    const value = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return value === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

function setStoredView(view: ViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, view);
  } catch {
    // ignore
  }
}

function setGlobalListViewClass(view: ViewMode) {
  const target = document.getElementById("main") ?? document.body;
  target.classList.toggle("companies-list-view", view === "list");
}

function applyView(root: HTMLElement, next: ViewMode) {
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
    ) as ViewMode | null;
    const active = btnView === next;

    btn.setAttribute("aria-checked", active ? "true" : "false");

    btn.classList.toggle("bg-bg-light", active);
    btn.classList.toggle("dark:bg-bg-dark", active);
    btn.classList.toggle("text-accent", active);
  }

  setGlobalListViewClass(next);
  // Below md, force card view and do not persist list mode.
  if (isMdUp()) setStoredView(next);
}

function init() {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-companies-view]"),
  );
  if (roots.length === 0) return;

  const initial: ViewMode = isMdUp() ? getStoredView() : "card";

  for (const root of roots) {
    applyView(root, initial);

    const mq = window.matchMedia(MD_QUERY);
    const onMqChange = () => {
      if (!mq.matches) {
        applyView(root, "card");
        return;
      }
      applyView(root, getStoredView());
    };
    mq.addEventListener("change", onMqChange);

    const buttons = Array.from(
      root.querySelectorAll<HTMLElement>("[data-companies-view-button]"),
    );

    for (const btn of buttons) {
      btn.addEventListener("click", () => {
        if (!isMdUp()) {
          applyView(root, "card");
          return;
        }
        const view = btn.getAttribute(
          "data-companies-view-button",
        ) as ViewMode | null;
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
