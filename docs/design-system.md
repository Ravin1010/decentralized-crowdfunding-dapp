# Visual design system — Modern Community Platform

**Status:** Approved visual direction; high-fidelity pages and responsive compositions are the next iteration.

## Brand concept

Community-first crowdfunding, with blockchain transparency as a supporting capability. Friendly, confident, and grounded. Not a financial trading dashboard or a generic crypto template.

## Design tokens

| Token | Hex | Use |
|---|---|---|
| Community blue | `#2855C7` | Primary action and brand |
| Deep navy | `#17263C` | Headings and important text |
| Warm coral | `#F27660` | Occasional human accent, not financial status |
| Soft canvas | `#F6F8FC` | Page background |
| White | `#FFFFFF` | Content surfaces |
| Mist blue | `#E9F0FF` | Quiet highlight |
| Mint | `#DDF4EA` | Positive background |
| Slate | `#65738B` | Supporting text |
| Divider | `#DFE5EF` | Borders |

Semantic colors (success, warning, error) require legible text and should not depend solely on color.

## Typography

- Headlines: Manrope, bold, deliberate scale.
- Body and controls: Inter, normal/medium.
- Addresses, transaction hashes, code-like identifiers: IBM Plex Mono.
- System font fallbacks until approved font assets are included. Never commit downloaded font files without clear licensing.

## Layout

- Desktop content width around 1200px, 12-column grid where appropriate.
- Mobile designed explicitly, not just compressed desktop.
- Buttons and inputs approx. 10px radius; cards approx. 12px radius.
- Borders and whitespace before shadows. Use subtle hover/focus transitions, approx. 150–220ms.
- Keep financial figures, progress, deadlines, and status immediately scannable.
- Campaign detail page should be distinct from the list; don't place the entire transactional flow in every card.

## Anti-generic design rules

1. Do not produce a generic SaaS hero, gradient dashboard, glass panel, or purple-neon cryptocurrency page.
2. Avoid repetitive identical cards, gratuitous shadows, glows, illustrations, and decorative charts.
3. Use differentiated editorial hierarchy, purpose-built layouts, and a small consistent component vocabulary.
4. Never use fabricated testimonials, supporters, transaction counts, or fake real-world campaign identities.
5. Mock campaign content must be labeled as demo data. No unlicensed third-party imagery.
6. Use accessible color contrast, keyboard navigation, visible focus, descriptive labels, and reduced-motion support.
7. Separate public browsing from wallet actions. No background popups, automatic network switches, or prompt-on-load.
8. Distinguish awaiting signature, pending chain confirmation, confirmed, and failed states visually.
9. Use a clear progress indicator without misleading rounding or overstating confirmed funds.
10. A frontend PR must include real screenshots of desktop and mobile layouts and identify any deviations from these rules.

## Iteration boundaries

Iteration 1 provides only neutral foundation styling/tokens. Iteration 2 should propose concrete homepage, listing, detail, and creation screens using static mock campaigns *before* wallet integration.
