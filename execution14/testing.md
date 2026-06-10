# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8214 --directory E:\experiment\execution14` → http://localhost:8214
(Note: port 8000 from the original script was occupied by another process; 8214 used instead.)
Browser: Google Chrome (driven via browser automation). Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Berlin/Germany, Overcast icon, 14°C, 64%, 5.7 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only; previous Berlin card stayed visible |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — offline simulated by stubbing `fetch` to reject (extension cannot toggle DevTools offline); network banner shown, Berlin card preserved, search button re-enabled |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS — single view hidden, compare visible, aria-selected updated |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C, identical card row grids, Cairo temp highlighted (.metric-leader) |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — Oslo card rendered, slot B cleared, banner: "qqqqq: We couldn't find that city…" |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Berlin (Overcast), Cairo (Clear sky), Singapore (Drizzle): 3 distinct SVGs; card visible text contains only city/temp/metrics |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — role="img" with aria-labels "Drizzle"/"Clear sky"/"Overcast", "Humidity", "Wind speed" |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — tab-single → tab-compare → city-input → search-btn all matched :focus-visible with 2px accent outline (rgb(37,99,235)) |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — verified at exact viewport widths 1920/1440/1280/800 (same-origin iframes; OS window was DPI-locked): no horizontal overflow in either view; below the 700px breakpoint (600px) compare grid stacks to 1 column and header stacks |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — all app requests to localhost:8214, geocoding-api.open-meteo.com, api.open-meteo.com; no key=/appid=/token= parameter in any URL |

Console check: zero uncaught errors from application code across a clean reload + single search + compare run.
(Two harness-injected exceptions from the fetch-stub test tooling appeared earlier in the session; stack traces confirm they originated in test eval frames, not in app scripts.)

## Traceability matrix (Step 5.4)

| Requirement | Implemented in | Proven by step |
|---|---|---|
| FR-1 | js/api.js, js/app.js | 1 |
| FR-2 | js/api.js, js/ui.js | 1 |
| FR-3 | js/ui.js (errorMessageFor), js/app.js | 2, 3, 6 |
| FR-4 | js/app.js (compare submit) | 5 |
| FR-5 | css/style.css (.compare-grid, card rows) | 5 |
| FR-6 | js/icons.js, js/ui.js | 7 |
| FR-7 | js/icons.js (aria-labels) | 8 |
| UI-1 | css/style.css tokens | visual review — single accent (#2563eb) + neutrals, 8px scale, two type sizes |
| UI-2 | css/style.css @media | 10 |
| UI-3 | index.html toggle, js/app.js switchView | 4 |
| TR-1/TR-2/TR-3 | js/api.js (Open-Meteo, no key) | 11 |
| TS-1/TS-2 | this document | all |

Additional automated check: `getIcon(c)` for all WMO codes 0–99 returns a valid {svg, label} — 0 failures (Task 2.1 done-check).

Out-of-scope check: no forecasts, no accounts, no native packaging present. ✓
