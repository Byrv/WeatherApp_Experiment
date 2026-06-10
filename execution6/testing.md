# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome. Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Berlin/Germany, overcast icon, 14°C, 64%, 6.4 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only; previous card untouched |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — verified twice: fetch-reject stub AND DevTools network emulation "Offline"; banner shown, Berlin card kept |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C, Cairo temp bold+accent (.metric-leader), rows aligned |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — banner: "qqqqq: We couldn't find that city…"; Oslo card rendered alone |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Cairo (Clear sky), Berlin/Oslo (Overcast), Singapore (Drizzle); card text contains only city/country/numbers |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — role="img" aria-labels: "Drizzle"/"Overcast", "Humidity", "Wind speed" on every card |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — 2px accent outline visible on Single/Compare tabs, inputs, buttons as Tab moves |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — viewport emulation at 1920/1440/1280/800: no overflow either view; compare grid stacks to 1 column below 700px (verified at 650). Note: physical display is 1536 logical px, so 1920 was checked via DevTools viewport emulation; layout is width-capped at 880px so ≥1280 widths are equivalent |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — 89 requests captured: all hosts are localhost:8000 or *.open-meteo.com; no key=/appid=/token= parameter in any URL |

Console: zero uncaught errors or exceptions across page load + searches.

Step 5.3 fix-and-retest loop: not needed — no FAIL recorded on first pass.

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

Additional checks performed during the run:
- Icon coverage: `Array.from({length:100},(_,c)=>getIcon(c)).filter(i=>!i||!i.svg).length` → 0 (every WMO code 0–99 resolves; Task 2.1 done-check).
- Empty-input compare guard: submitting with one field blank shows "Enter both cities to compare." without firing requests.
- Open-Meteo endpoints validated from CLI before any code depended on them (Milestone 0): geocoding returned London 51.50853/-0.12574; forecast returned all four current fields.

Out-of-scope check: no forecasts, no accounts, no native packaging present. ✓
