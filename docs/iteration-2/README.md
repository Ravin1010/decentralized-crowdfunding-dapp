# Iteration 2 review evidence

Static community frontend prototype, based on `61da25e742c56aee9c0e2bd08b303e6ca6f9feea`.

## Screenshots

Actual Chromium captures of the implemented Vite application, with fonts loaded. Captured at desktop 1440 × 900, tablet 768 × 900 and mobile 375 × 812. Images include the full page, so their heights vary. All four pages were visually inspected at all three widths; a second capture followed corrections to missing icon glyphs and campaign artwork spacing.

| Page | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Homepage | [Screenshot](screenshots/home-desktop.png) | [Screenshot](screenshots/home-tablet.png) | [Screenshot](screenshots/home-mobile.png) |
| Explore | [Screenshot](screenshots/explore-desktop.png) | [Screenshot](screenshots/explore-tablet.png) | [Screenshot](screenshots/explore-mobile.png) |
| Campaign details | [Screenshot](screenshots/detail-desktop.png) | [Screenshot](screenshots/detail-tablet.png) | [Screenshot](screenshots/detail-mobile.png) |
| Create | [Screenshot](screenshots/create-desktop.png) | [Screenshot](screenshots/create-tablet.png) | [Screenshot](screenshots/create-mobile.png) |

Additional captures: [fully funded / Active](screenshots/detail-state-2.png), [Successful](screenshots/detail-state-3.png), [Failed](screenshots/detail-state-4.png), [Cancelled](screenshots/detail-state-5.png), [second Active](screenshots/detail-state-6.png), [validation errors](screenshots/create-validation.png), [wallet design examples](screenshots/wallet-preview.png).

## Verification

- `cd web && npm ci --cache /tmp/decen-npm-cache`: passed, 26 packages installed. The initial sandboxed `npm ci` failed due to environment network/cache restrictions; the retry used approved execution access and a writable cache. No lockfile changes.
- `cd web && npm run typecheck`: passed.
- `cd web && npm run build`: passed; 19 modules transformed.
- `git diff --check`: passed.
- `python docs/iteration-2/verify-browser.py`: passed using the environment's Python Playwright and `/usr/bin/chromium`, with Vite running at port 5173. See [browser results](browser-results.json).
- Browser assertions: all four routes at all three widths without overflow, approved fonts loaded, six detail statuses, progress at most 100%, disabled financial actions, required-field errors and focus, zero-goal rejection, 31-day rejection / 30-day acceptance, local review without publishing or persistence, wallet modal Escape and focus return, keyboard skip link, reduced-motion CSS, unknown route fallback. No browser JavaScript errors.
- Source inspection: no wallet/provider access, blockchain dependencies, requests, timers, listeners, storage, backend or contract changes. React review: local state only, stable fixture keys, semantic regions, explicit labels and error associations, native dialog and disabled actions.

## Design and limitations

Uses approved colors, self-hosted Manrope, Inter and IBM Plex Mono, original CSS campaign covers, and small inline SVG icons. Fontsource 5.3.0 font assets retain their SIL Open Font License notices in `web/public/fonts`; no runtime font service or added npm dependencies.

Navigation uses ordinary path links and Vite's SPA fallback; no router dependency. A future static host must rewrite application paths to `index.html`. No deployment was performed.

Fixtures are a fixed snapshot at 2 November 2026, 12:00 UTC, rather than live countdowns. Full funding before deadline remains Active. Historical raised amounts remain visible for Failed/Cancelled campaigns and are not represented as current escrow or refundable wallet balances.

The form offers whole-day durations from 1 to 30 days, a deliberate friendly subset of the future contract's 60-second to 30-day range. It validates and reviews locally; nothing is saved or published. Contribution inputs and financial buttons are disabled. Wallet states are isolated visual examples, never simulated connections or transactions.

No material visual design deviations. Search, filters, uploads, profiles, backend, wallet connection and all blockchain functionality remain outside this iteration. No contract files were changed. No merge or deployment. Iteration 3 has not started.
