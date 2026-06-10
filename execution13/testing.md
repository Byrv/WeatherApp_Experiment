# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome. Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — overcast icon, 14°C, 64%, 6.4 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only; previous Berlin card kept |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — simulated via fetch-reject override (extension cannot toggle DevTools Offline); network banner shown, previous card kept |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS — one click |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C, Cairo highlighted |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — "qqqqq: We couldn't find that city…" |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Berlin/Oslo Overcast, Cairo Clear sky, Singapore Drizzle; no condition text |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — a11y tree: img "Drizzle"/"Overcast" + "Humidity" + "Wind speed"; getIcon(0–99) → 0 gaps |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — rings on tabs, input, Search button |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — no h-overflow at any width, both views (verified via per-width viewports; compare stacks to 1 column ≤700px) |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — only geocoding-api/api.open-meteo.com + localhost; no key/appid/token params; zero console errors |

All 11 steps PASS (step 3 via fetch-reject simulation). Run executed via Chrome browser automation on 2026-06-10.

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
