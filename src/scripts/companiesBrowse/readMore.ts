import { qs, qsa } from "./dom";

export function initReadMore(root: ParentNode) {
  const textEls = qsa<HTMLElement>(root, "[data-readmore-text]");
  for (const textEl of textEls) {
    const container = textEl.parentElement;
    if (!container) continue;
    const btn = qs<HTMLButtonElement>(container, "[data-readmore-toggle]");
    if (!btn) continue;

    const clampClass =
      textEl.getAttribute("data-readmore-clamp") || "line-clamp-3";

    const setClamped = (clamped: boolean) => {
      if (clamped) {
        textEl.classList.remove("line-clamp-none");
        textEl.classList.add(clampClass);
      } else {
        textEl.classList.remove(clampClass);
        textEl.classList.add("line-clamp-none");
      }
    };

    const setExpanded = (expanded: boolean) => {
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? "Read less" : "Read more";
      setClamped(!expanded);
    };

    const updateVisibility = () => {
      // Robust overflow detection for CSS line-clamp:
      // compare the element's height when clamped vs unclamped.
      const expanded = btn.getAttribute("aria-expanded") === "true";

      // Always measure from the clamped state.
      setClamped(true);
      const clampedHeight = textEl.getBoundingClientRect().height;

      setClamped(false);
      const fullHeight = textEl.getBoundingClientRect().height;

      // Restore the user's current state.
      setClamped(!expanded ? true : false);

      const isOverflowing = fullHeight - clampedHeight > 1;
      btn.classList.toggle("hidden", !isOverflowing);
    };

    setExpanded(false);

    let scheduled = false;
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        updateVisibility();
      });
    };

    queueMicrotask(scheduleUpdate);
    scheduleUpdate();

    // Re-check when the element's size changes (e.g., responsive wrapping).
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(scheduleUpdate);
      ro.observe(textEl);
    }

    btn.onclick = (e) => {
      e.preventDefault();
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setExpanded(!expanded);
    };
  }
}
