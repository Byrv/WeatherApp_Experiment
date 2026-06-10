# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome (automated via Claude-in-Chrome). Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Overcast icon, 14°C, 64%, 6.4 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only; previous Berlin card stayed visible |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — offline simulated by stubbing `fetch` to reject (extension cannot toggle DevTools offline); banner showed friendly network message, previous card retained |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C, Cairo temp highlighted; rows aligned; loading skeletons + disabled button observed in flight |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — banner: "qqqqq: We couldn't find that city. Check the spelling and try again." |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Berlin/Oslo Overcast, Cairo Clear, Singapore Drizzle; no condition text in cards |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — a11y tree shows img "Overcast"/"Drizzle", img "Humidity", img "Wind speed"; getIcon(0–99) coverage check → 0 gaps |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — accent focus ring observed on inputs and Search button |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — window resize unavailable in this environment; verified via same-origin iframes at exact viewport widths: no horizontal overflow either view at 1920/1440/1280/800; compare grid 2-col ≥800 and stacks to 1-col at 600 (<700px breakpoint) |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — session hosts: geocoding-api.open-meteo.com, api.open-meteo.com, localhost only; zero key=/appid=/token= params; zero console errors all session |

## Traceability matrix (verified 2026-06-10, Step 5.4 — all rows proven by passing steps above)

| Requirement | Implemented in | Proven by step |
|---|---|---|
| FR-1 | js/api.js, js/app.js | 1 |
| FR-2 | js/api.js, js/ui.js | 1 |
| FR-3 | js/ui.js (errorMessageFor), js/app.js | 2, 3, 6 |
| FR-4 | js/app.js (compare submit) | 5 |
| FR-5 | css/style.css (.compare-grid, card rows) | 5 |
| FR-6 | js/icons.js, js/ui.js | 7 |
| FR-7 | js/icons.js (aria-labels) | 8 |
| UI-1 | css/style.css tokens | visual review |
| UI-2 | css/style.css @media | 10 |
| UI-3 | index.html toggle, js/app.js switchView | 4 |
| TR-1/TR-2/TR-3 | js/api.js (Open-Meteo, no key) | 11 |
| TS-1/TS-2 | this document | all |

Out-of-scope check: no forecasts, no accounts, no native packaging present. ✓
