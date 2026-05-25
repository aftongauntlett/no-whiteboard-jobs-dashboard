## Opener Prompt For New Chat

Copy/paste this to start a new agent chat:

```text
Execute the accessibility and UX audit runbook in .github/wcag-audit.md for this repo.

Focus areas:
- WCAG 2.2 AA best-practice compliance across /, /about, /hiring-tips, and /page/2
- Keyboard navigation, focus order/visibility, and Escape/focus-return behavior
- Responsive overlap/reflow issues (especially browse toolbar + results controls)
- Color contrast in light/dark theme tokens
- Lighthouse scores (mobile + desktop) with evidence

Required actions:
1) Run lint, test, and build first.
2) Run Lighthouse on all scoped routes and write JSON artifacts to .github/audit.
3) Perform manual keyboard and responsive checks from the runbook.
4) Implement fixes with minimal, safe diffs.
5) Remove verified dead code in touched areas.

Return format:
- Findings by severity with file references
- Exact code changes made
- Test/build/Lighthouse results
- Remaining risks and explicit DoD pass/fail
```

# No Whiteboard Jobs Accessibility + UX Audit Runbook

This is the execution plan for auditing and fixing accessibility, keyboard navigation, responsive overlap, contrast, and Lighthouse quality in this specific Astro app.

Use this file as the source of truth when assigning work to an agent.

## Scope (This Repo)

Routes to audit:

- `/`
- `/about`
- `/hiring-tips`
- `/page/[page]` (spot-check at least `/page/2`)

High-risk components and scripts:

- Browse controls and results: `src/components/company/CompaniesBrowseSection.astro`
- Browse toolbar and menu trigger: `src/components/company/browse/BrowseToolbar.astro`
- View/per-page controls: `src/components/company/browse/BrowseViewToggle.astro`, `src/components/company/browse/BrowsePerPageControls.astro`
- Sidebar + collapse behavior: `src/components/layout/Sidebar.astro`, `src/components/layout/NavLinks.astro`
- Mobile nav dialog/focus trap: `src/components/layout/MobileHeader.astro`
- Interactive forms and validation messaging:
  - `src/components/ui/SuggestionForm.astro`
  - `src/components/ui/ResourceSuggestionForm.astro`
- Browse client behavior:
  - `src/scripts/companiesBrowse/*.ts`
  - `src/scripts/companiesViewToggle.ts`
- Global theming and focus styles: `src/styles/global.css`

## Current Baseline (Verified)

Already fixed in current working tree:

1. Mid-width overlap pressure in browse controls by reducing cramped md layout behavior and allowing wrap.
2. Sidebar collapsed nav links now retain explicit accessible names.
3. Dead code cleanup: removed unused `closeMenu` argument in browse render controller wiring.

Still required:

1. Full keyboard-only walkthrough across all interactive flows.
2. Contrast validation against WCAG 2.2 AA for both light/dark themes.
3. Lighthouse runs (mobile + desktop) with documented score evidence.
4. Reflow/zoom stress test (200% zoom and small viewport widths).

## Acceptance Criteria (DoD)

Do not mark complete until all are true:

1. No keyboard trap in mobile nav dialog and filter menu.
2. All icon-only controls have accessible names.
3. Focus indicators are consistently visible on actionable controls.
4. No overlap/cutoff at these widths: `1280, 1024, 768, 640, 390, 375, 320`.
5. Usable at 200% zoom without hidden or unreachable controls.
6. Form errors are announced and associated with fields.
7. Lighthouse targets met on audited routes:
   - Accessibility: `>= 98`
   - Best Practices: `>= 95`
   - SEO: `>= 95`
   - Performance: `>= 90` (document any justified exception)

## Agent Execution Steps

### 1) Preflight

```sh
npm run lint
npm run test
npm run build
```

### 2) Start app for manual and automated audits

```sh
npm run dev -- --host 127.0.0.1 --port 4321
```

### 3) Run Lighthouse (mobile + desktop)

Create output directory and run:

```sh
mkdir -p .github/audit
npx lighthouse http://127.0.0.1:4321/ --only-categories=accessibility,best-practices,seo,performance --form-factor=mobile --screenEmulation.mobile --output=json --output-path=.github/audit/lh-home-mobile.json
npx lighthouse http://127.0.0.1:4321/ --only-categories=accessibility,best-practices,seo,performance --preset=desktop --output=json --output-path=.github/audit/lh-home-desktop.json
```

Repeat for `/about`, `/hiring-tips`, and `/page/2`.

### 4) Manual keyboard checks (required)

Perform and log pass/fail evidence for:

1. `Tab` order from skip link through footer.
2. `Enter/Space` activation for nav, filters, toggles, and pagination.
3. `Escape` closes mobile menu and filter menu.
4. Focus return to trigger after closing overlays.
5. Browse results remain usable while menu/filter state changes.

### 5) Responsive + reflow checks (required)

At each width `1280, 1024, 768, 640, 390, 375, 320`:

1. Verify no overlap in browse toolbar, count row, and cards/list rows.
2. Verify sidebar/mobile nav transitions remain usable.
3. Verify controls are not clipped and can be reached via keyboard.

At 200% zoom:

1. Confirm search, filter, view toggle, and pagination remain operable.
2. Confirm text does not overlap action buttons (e.g., "Read more").

### 6) Contrast checks

Check theme token usage and visible combinations for:

1. Body text, muted text, and links on surface/background.
2. Status badges (`success`, `warning`, `info`, `green`).
3. Focus rings against both light and dark surfaces.
4. Hover-only affordances still discoverable on keyboard focus.

## Test Automation Rules To Add

Yes, add test rules. For this Astro app, the best value comes from browser-level tests plus a11y scanning.

Recommended stack:

1. Playwright (`@playwright/test`) for end-to-end keyboard, focus, and responsive behavior.
2. axe (`@axe-core/playwright`) for automated WCAG rule scanning on key routes.
3. Lighthouse CI (`lighthouse`, `@lhci/cli`) for score gates and regression tracking.
4. Keep existing utility tests (`npm run test`) for pure TypeScript logic.
5. Jest is optional and not required here unless you need deep unit/component mocking; otherwise avoid extra tooling overlap.

### Required CI Gates (PR Blocking)

Add these rules to pull request checks once baseline is stable:

1. `npm run lint` passes.
2. `npm run test` passes.
3. `npm run build` passes.
4. Playwright smoke suite passes on `/`, `/about`, `/hiring-tips`, `/page/2`.
5. axe checks report zero critical and serious violations on the same routes.
6. Lighthouse thresholds are met (from Acceptance Criteria) or explicitly waived with reason in PR.

### Initial Tests To Create First

Create these before broadening coverage:

1. Keyboard nav smoke test:

- skip link works
- mobile nav opens/closes with keyboard
- filter menu opens/closes with keyboard + Escape
- focus returns to trigger on close

2. Responsive overlap smoke test:

- no horizontal overflow at `1280, 1024, 768, 640, 390, 375, 320`
- browse controls do not visually overlap

3. Form accessibility smoke test for both suggestion forms:

- required validation appears
- error summary is announced/focusable
- invalid fields get `aria-invalid`

4. Route-level axe scans for `/`, `/about`, `/hiring-tips`, `/page/2`.

### Suggested Rollout

1. Phase 1 (baseline): add tests, run in CI, report-only for 1-2 PRs.
2. Phase 2 (enforcement): fail PRs on new serious/critical axe violations and failing keyboard/responsive smoke tests.
3. Phase 3 (hard gate): enforce Lighthouse thresholds as blocking checks.

### Agent Instruction Add-On

When executing this runbook, the agent should also:

1. Add or update Playwright + axe tests for the initial cases above.
2. Wire the tests into CI.
3. Include test artifacts and failure details in its final report.

## Fix Strategy Rules

1. Prefer small, targeted diffs.
2. Keep Astro-first approach; avoid new framework islands.
3. Do not hardcode ad-hoc colors; use semantic CSS variables.
4. Preserve data-source rules (upstream dataset remains source of truth).
5. Remove verified dead code encountered during fixes.

## Required Agent Output

Agent must return:

1. Findings by severity with file references and why each issue matters.
2. Exact changes made with concise rationale.
3. Command/test results (`lint`, `test`, `build`, Lighthouse).
4. Remaining manual checks that still need a human pass.
5. Final risk summary with explicit pass/fail against acceptance criteria.

## Copy/Paste Agent Prompt

```text
Execute the accessibility and UX audit runbook in .github/wcag-audit.md for this repo.

Constraints:
- Target WCAG 2.2 AA best practices.
- Fix issues directly in code with minimal safe diffs.
- Prioritize keyboard access, focus visibility/order, responsive overlap/reflow, contrast, and Lighthouse scores.
- Remove verified dead code encountered in touched areas.
- Do not claim legal compliance.

Must do:
1) Run lint/test/build.
2) Run Lighthouse (mobile + desktop) on /, /about, /hiring-tips, /page/2 and save JSON artifacts under .github/audit.
3) Perform manual keyboard + responsive checks described in the runbook.
4) Implement fixes and re-run relevant checks.

Return format:
- Findings by severity with file paths and line references.
- Code changes made.
- Before/after score table for Lighthouse categories.
- Remaining risks and explicit DoD pass/fail status.
```
