# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome. Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Berlin, Germany; overcast icon; 14°C; 64%; 6.4 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only; Berlin card stayed visible |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — offline simulated by stubbing fetch to reject (extension cannot toggle DevTools offline); banner showed friendly network message; previous card (Mumbai) stayed visible |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS — one click; single-view data preserved on return |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C; rows aligned; Cairo temp highlighted in accent |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — banner: "qqqqq: We couldn't find that city…" |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Dubai (clear/sun), Berlin (overcast/cloud), Mumbai (drizzle); no condition words in cards |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — a11y tree: img "Drizzle", img "Overcast", img "Humidity", img "Wind speed" |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — blue ring on Single, Compare, input, Search |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — clean at all widths; at 646px viewport compare grid stacks to 1 column, header stacks, no horizontal scroll (verified via computed styles) |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — hosts: api.open-meteo.com, geocoding-api.open-meteo.com, localhost (+ Chrome-extension internals); 0 URLs with key=/appid=/token= |

Console check: zero uncaught errors or exceptions across the whole session.
Icon coverage check (Milestone 2): `Array.from({length:100},(_,c)=>getIcon(c)).filter(i=>!i||!i.svg).length` → 0.

## Traceability matrix (filled in Step 5.4)

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
