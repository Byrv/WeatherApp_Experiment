# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome. Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Berlin/Germany, overcast icon, 14°C, 64%, 6.4 km/h |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner only, dismissible |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — simulated by stubbing `fetch` to reject (extension cannot toggle DevTools offline); network banner shown, Berlin card retained |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Cairo 25°C highlighted in accent vs Oslo 13°C |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — "qqqqq: We couldn't find that city…" |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Berlin (overcast), Cairo (clear), Singapore (drizzle); no condition text in cards |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — a11y tree shows img "Drizzle"/"Overcast"/"Clear sky", img "Humidity", img "Wind speed" |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — blue outline on tabs, input, Search button |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — verified at 1707 (display max; 1920 exceeds screen, layout is centered max-width 880 so equivalent), 1440 window; 1280 and 650 via same-origin iframe viewports; compare grid stacks below 700px; scrollWidth checks confirm zero horizontal overflow at all widths |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — Performance API resource audit: hosts = localhost:8000, geocoding-api.open-meteo.com, api.open-meteo.com; no key/appid/token/apikey params |

Console: zero uncaught errors or exceptions across the session.

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

Additional done-checks:
- Task 2.1: `getIcon(c)` for all codes 0–99 → 0 unmapped; 9 distinct labels (Clear sky, Partly cloudy, Overcast, Fog, Drizzle, Rain, Snow, Thunderstorm, Unknown conditions).
- Milestone 0: both Open-Meteo endpoints validated from CLI before implementation; all four FR-2 metrics present; no key in URLs.

Out-of-scope check: no forecasts, no accounts, no native packaging present. ✓
