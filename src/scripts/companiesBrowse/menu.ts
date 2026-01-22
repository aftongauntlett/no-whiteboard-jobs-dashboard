import { qs } from "./dom";

type MenuController = {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableInPanel(panel: HTMLElement): HTMLElement[] {
  const nodes = Array.from(panel.querySelectorAll(focusableSelector));
  return nodes.filter((el): el is HTMLElement => {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  });
}

export function createCompaniesMenuController(
  section: HTMLElement,
): MenuController {
  const menuRoot = qs<HTMLElement>(section, "[data-companies-menu]");
  const menuScrim = qs<HTMLElement>(section, "[data-companies-menu-scrim]");
  const menuButton = qs<HTMLButtonElement>(
    section,
    "[data-companies-menu-button]",
  );
  const menuPanel = qs<HTMLElement>(section, "[data-companies-menu-panel]");
  const companiesBackground = qs<HTMLElement>(
    section,
    "[data-companies-background]",
  );

  let lastTrigger: HTMLElement | null = null;

  const onPanelKeydown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    if (!menuPanel) return;

    const focusables = getFocusableInPanel(menuPanel);
    if (focusables.length === 0) {
      e.preventDefault();
      menuPanel.focus?.();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    const isShift = e.shiftKey;
    const activeInPanel =
      active instanceof HTMLElement && menuPanel.contains(active);

    if (!activeInPanel) {
      e.preventDefault();
      (isShift ? last : first).focus();
      return;
    }

    if (isShift) {
      if (active === first || active === menuPanel) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const setFocusTrapActive = (active: boolean) => {
    if (!menuPanel) return;
    if (active) menuPanel.addEventListener("keydown", onPanelKeydown);
    else menuPanel.removeEventListener("keydown", onPanelKeydown);
  };

  const setBackgroundInert = (open: boolean) => {
    if (!companiesBackground) return;
    if (open) companiesBackground.setAttribute("aria-hidden", "true");
    else companiesBackground.removeAttribute("aria-hidden");
    // `inert` is supported in modern browsers; fall back gracefully.
    (companiesBackground as HTMLElement & { inert?: boolean }).inert = open;
  };

  const positionPanel = () => {
    if (!menuButton || !menuPanel) return;
    if (menuPanel.classList.contains("hidden")) return;

    const buttonRect = menuButton.getBoundingClientRect();
    const gap = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Temporarily ensure a measurable width.
    const panelW = menuPanel.offsetWidth;
    const panelH = menuPanel.offsetHeight;

    const maxLeft = Math.max(gap, viewportW - panelW - gap);
    const left = Math.min(maxLeft, Math.max(gap, buttonRect.right - panelW));

    const maxTop = Math.max(gap, viewportH - panelH - gap);
    const top = Math.min(maxTop, Math.max(gap, buttonRect.bottom + gap));

    menuPanel.style.left = `${left}px`;
    menuPanel.style.top = `${top}px`;
  };

  let detachPositioning: (() => void) | null = null;
  const setPositioningActive = (active: boolean) => {
    if (detachPositioning) {
      detachPositioning();
      detachPositioning = null;
    }
    if (!active) return;

    const onChange = () => positionPanel();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    detachPositioning = () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  };

  const setOpen = (open: boolean) => {
    if (!menuButton || !menuPanel) return;

    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuPanel.classList.toggle("hidden", !open);
    menuPanel.setAttribute("aria-hidden", open ? "false" : "true");

    if (open) {
      // Ensure panel has a concrete position when opened (it is now a sibling
      // container, not absolutely positioned under the button).
      requestAnimationFrame(() => positionPanel());
    }

    if (menuScrim) menuScrim.classList.toggle("hidden", !open);

    if (open) {
      lastTrigger = menuButton;
      document.body.style.overflow = "hidden";
      setBackgroundInert(true);
      setFocusTrapActive(true);
      setPositioningActive(true);

      const firstInteractive = qs<HTMLElement>(
        menuPanel,
        "[data-companies-sort-option], [data-companies-employment-option], [data-companies-reset]",
      );
      (firstInteractive || menuPanel).focus?.();
    } else {
      document.body.style.overflow = "";
      setBackgroundInert(false);
      setFocusTrapActive(false);
      setPositioningActive(false);
      if (lastTrigger) lastTrigger.focus?.();
      lastTrigger = null;
    }
  };

  const isOpen = () => menuButton?.getAttribute("aria-expanded") === "true";

  const close = () => setOpen(false);
  const open = () => setOpen(true);
  const toggle = () => setOpen(!isOpen());

  if (menuButton && menuPanel) {
    menuButton.addEventListener("click", toggle);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!isOpen()) return;
      e.preventDefault();
      close();
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      const target = e.target as Node | null;
      if (!target) return;
      // Close when clicking outside the button/panel.
      if (menuPanel.contains(target)) return;
      if (menuButton.contains(target)) return;

      // If we can't find expected nodes, fall back to the old behavior.
      if (menuRoot && menuRoot.contains(target)) {
        close();
        return;
      }

      close();
    });
  }

  if (menuScrim) {
    menuScrim.addEventListener("click", () => {
      close();
      menuButton?.focus();
    });
  }

  // Ensure the panel is initially hidden from AT.
  if (menuPanel)
    menuPanel.setAttribute("aria-hidden", isOpen() ? "false" : "true");

  return { isOpen, open, close, toggle };
}
