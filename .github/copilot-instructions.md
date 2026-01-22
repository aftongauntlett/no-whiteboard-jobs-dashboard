# Copilot Instructions

This repo is an Astro dashboard deployed on Vercel. Optimize for clean UI, accessibility, and maintainability. Make changes in small, reviewable steps.

## Project goals

- Calm, readable UI that works in light + dark mode
- Strong accessibility (keyboard, focus, semantics, labels, contrast)
- Good Lighthouse baseline (Perf, A11y, Best Practices, SEO)
- Minimal dependencies and no backend required for core features
- Keep the upstream dataset as source of truth, allow local additions/overrides separately

## Tech stack + conventions

- Astro (pages/components), TypeScript where possible
- Tailwind + custom CSS variables for theming
- Prefer simple, semantic HTML + small utility classes
- Avoid introducing React/Vue unless the project already uses it for specific islands

## Theming rules (very important)

- Do not hardcode colors for UI, icons, borders, hovers, chips, text
- Use CSS custom properties in `src/styles/...` (e.g. `--bg`, `--surface`, `--surface-hover`, `--text`, `--text-muted`, `--border`, `--accent`, `--primary`, `--secondary`, `--coral`)
- When adding a new “semantic color”, add a CSS variable for it and reference that
- Keep hover states consistent across components (cards, list rows, accordion headers)

## Data rules (source of truth + local changes)

- Upstream dataset (the original companies list) must not be mutated by tools/scripts
- Any additions/edits must live in separate local files (ex: `updated-companies.json`, `new-companies.json`)
- At build time, the app can merge datasets, but must preserve traceability
  - For locally changed entries, keep metadata like:
    - `overrideReason`, `overrideDate`, `source: "local"`
- UI must clearly indicate entries that were added/edited locally (chip or icon + tooltip)
- Users should only see entries that you explicitly added/edited, not “audit-only” flags

## UI + component design

- Prefer reusable components for repeated patterns:
  - Card, ListRow, Badge/Chip, Button, Pagination, Accordion, Dropdown/Menu, SearchInput
- Keep pages thin; push layout and UI logic into components and utilities
- Files over ~300–500 lines should be split into smaller modules/components
- Avoid repeated markup for the same UI pattern (no rogue buttons/cards)

## Interaction patterns

- Search is primary and always visible
- Filters/sort live in a menu/panel triggered by a single button
- No dropdown should block live-updating search results
- “Open in new tab” icons appear on hover/focus, not always visible
- Mobile:
  - Prefer “cards only” (hide list toggle)
  - Prefer “Show more” progressive loading over full pagination UI
  - Keep search + filters on one row where possible

## Accessibility checklist

- Use semantic landmarks: header/nav/main/footer
- All icon-only buttons must have accessible names (`aria-label`)
- Focus states must be visible and high-contrast
- Dropdowns/menus:
  - No focus traps unless intentional and implemented correctly
  - Escape closes
  - Focus returns to trigger
- Accordions:
  - Correct button semantics (or `<summary>` done carefully)
  - State is perceivable to screen readers
- Ensure color contrast in both light and dark mode

## Performance + safety

- Avoid expensive work on every keystroke; debounce search if needed
- Avoid layout shift: reserve space for expanding/collapsing UI when possible
- Avoid hydration-heavy solutions; Astro-first approach preferred
- Keep scripts/tools polite (rate limits, concurrency limits, timeouts)

## Scripts and tooling

- Scripts belong in `scripts/`
- They must be runnable with `node scripts/<name>.js`
- Use small dependencies only if necessary (prefer built-in `fetch`, `URL`, etc.)
- Scripts that audit data must not write to upstream datasets unless explicitly requested
- Scripts that generate merged datasets should write to a dedicated build artifact file

## Output expectations

When implementing a feature, include:

- What files changed and why
- Notes about accessibility impacts
- How to test manually (short checklist)

## Git habits

- Do not run git restore/rollback commands automatically
- Keep changes grouped and commit-worthy
- If asked to commit: no emojis, clear messages
