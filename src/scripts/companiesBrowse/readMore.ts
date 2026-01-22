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
      const isOverflowing = textEl.scrollHeight - textEl.clientHeight > 1;
      btn.classList.toggle("hidden", !isOverflowing);
    };

    setExpanded(false);

    queueMicrotask(updateVisibility);
    window.requestAnimationFrame(updateVisibility);

    btn.onclick = (e) => {
      e.preventDefault();
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setExpanded(!expanded);
    };
  }
}
