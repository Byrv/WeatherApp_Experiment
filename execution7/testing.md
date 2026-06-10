# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000 --directory E:\experiment\execution7` → http://localhost:8000
Browser: Google Chrome (claude-in-chrome automation). Date: 2026-06-10  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | PASS — Berlin/Germany, 14°C, 64%, 6.4 km/h, Overcast icon |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | PASS — friendly banner, no error codes/stacks |
| 3 | Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | PASS — simulated via fetch-rejection stub (extension cannot toggle DevTools offline); Berlin card retained |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | PASS — view switched, aria-selected updated |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | PASS — Oslo 13°C / Cairo 25°C, Cairo highlighted (screenshot verified) |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | PASS — "qqqqq: We couldn't find that city…", slot B cleared |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | PASS — Clear sky (Dubai), Drizzle (Singapore), Partly cloudy (London); no visible condition text |
| 8 | Accessibility labels on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | PASS — role="img" with "Overcast"/"Clear sky"/etc., "Humidity", "Wind speed" |
| 9 | Tab key through all controls | Visible focus ring on every control | PASS — 2px accent outline visible (screenshot verified) |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | PASS — zero horizontal overflow at 1920/1440/1280/800 (+380 mobile check); compare grid 2-col ≥800, stacks 1-col <700 (iframe viewport emulation; physical display max 1536px) |
| 11 | Network audit, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | PASS — hosts: localhost:8000, geocoding-api.open-meteo.com, api.open-meteo.com; zero key/appid/token params across 34 requests |

Console: zero uncaught errors across the session (only the browser's automatic `favicon.ico` 404, not an app asset).

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
| UI-1 | css/style.css tokens | visual review (screenshots, Step 5/9) |
| UI-2 | css/style.css @media | 10 |
| UI-3 | index.html toggle, js/app.js switchView | 4 |
| TR-1/TR-2/TR-3 | js/api.js (Open-Meteo, no key) | 11 |
| TS-1/TS-2 | this document | all |

Additional unit-level checks run in the browser console:
- `getCityWeather("Tokyo")` → full record with all four metrics ✓
- `geocodeCity("zzzzqqq")` → throws `CityNotFoundError` ✓
- `getIcon(c)` for all codes 0–99 → zero undefined icons ✓

Out-of-scope check: no forecasts, no accounts, no native packaging present. ✓
