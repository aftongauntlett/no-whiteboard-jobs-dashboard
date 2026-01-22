import { isMdUp, MD_QUERY } from "../../utils/viewMode";

import { getView } from "./view";
import {
  defaultPerPageForView,
  nearestOption,
  perPageOptionsForView,
} from "./paginationConfig";
import type { BrowseState, MobilePagingState } from "./types";

export function bindPaginationController(args: {
  section: HTMLElement;
  perPageButtons: HTMLButtonElement[];
  showMoreButton: HTMLButtonElement | null;
  state: BrowseState;

  render: (options?: { append?: boolean }) => void;
  getLastTotalPages: () => number;
  getMobilePagingState: () => MobilePagingState;
  setShowMoreState: (state: MobilePagingState) => void;
  resetMobilePaging: () => void;
}) {
  const {
    section,
    perPageButtons,
    showMoreButton,
    state,
    render,
    getLastTotalPages,
    getMobilePagingState,
    setShowMoreState,
    resetMobilePaging,
  } = args;

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
      state.perPage = next;
      state.page = 1;
      render();
    });
  }

  if (showMoreButton) {
    showMoreButton.addEventListener("click", () => {
      if (isMdUp()) return;
      if (getMobilePagingState() === "loading") return;

      const lastTotalPages = getLastTotalPages();
      if (state.page >= lastTotalPages) {
        setShowMoreState("done");
        return;
      }

      setShowMoreState("loading");

      window.requestAnimationFrame(() => {
        state.page = Math.min(lastTotalPages, state.page + 1);
        render({ append: true });
      });
    });
  }

  for (const btn of Array.from(
    section.querySelectorAll<HTMLElement>("[data-companies-view-button]"),
  )) {
    btn.addEventListener("click", () => {
      const view = getView();
      const allowed = perPageOptionsForView(view);
      if (!allowed.includes(state.perPage)) {
        state.perPage = nearestOption(state.perPage, allowed);
      }
      render();
    });
  }

  const mdMq = window.matchMedia(MD_QUERY);
  let lastMdUp = mdMq.matches;
  const onMdChange = (e: MediaQueryListEvent) => {
    const nowMdUp = e.matches;
    if (nowMdUp === lastMdUp) return;
    lastMdUp = nowMdUp;

    if (!nowMdUp) {
      resetMobilePaging();
      state.page = 1;
    } else {
      // Ensure perPage is valid for the view on md+ transitions.
      const view = getView();
      const allowed = perPageOptionsForView(view);
      if (!allowed.includes(state.perPage))
        state.perPage = defaultPerPageForView(view);
    }

    render();
  };
  mdMq.addEventListener("change", onMdChange);
}
