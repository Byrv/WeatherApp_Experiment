# Weather App — Implementation Plan

This plan implements every requirement in [requirements.md](requirements.md). Each task lists the requirement IDs it satisfies, concrete steps, and a verifiable "Done when" condition. Milestones are sequential; tasks within a milestone are ordered but some can be done in parallel (noted where applicable).

**Tech approach (decided up front):** plain HTML/CSS/JavaScript single-page app, no build step, no framework. Data from [Open-Meteo](https://open-meteo.com/) (forecast API + geocoding API — free, no API key, CORS-enabled), satisfying TR-1/TR-2/TR-3 by construction. Weather icons rendered as inline SVG with `aria-label`s.

---

## Milestone 0 — Project Setup & API Validation

**Goal:** A running skeleton with confirmed API behavior, so no later milestone is blocked by API surprises.
**Requirements covered:** TR-1, TR-2, TR-3 (groundwork)

### Task 0.1 — Scaffold project structure
- Create files:
  - `index.html` — single page hosting both single-city and compare views
  - `css/style.css` — all styles
  - `js/api.js` — API layer (geocoding + weather fetch)
  - `js/icons.js` — weather-code → SVG icon mapping
  - `js/ui.js` — DOM rendering (weather cards, compare layout, errors)
  - `js/app.js` — wiring: event handlers, state, view switching
- Add `<meta name="viewport">` and semantic landmarks (`<header>`, `<main>`).
- **Done when:** opening `index.html` in Chrome shows an empty styled shell with no console errors.

### Task 0.2 — Validate Open-Meteo endpoints manually
- Confirm geocoding: `GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=5` returns name, country, latitude, longitude.
- Confirm weather: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` returns all four metrics required by FR-2.
- Record the full list of WMO `weather_code` values (0–99) and group them into icon categories (see Task 2.1).
- Confirm both endpoints work with no API key and respond to requests from a `file://` or localhost origin (TR-3).
- **Done when:** both endpoints verified in Chrome (DevTools Network tab), sample responses saved as comments in `js/api.js`.

### Task 0.3 — Decide units and formatting conventions
- Temperature in °C, wind speed in km/h, humidity in % (Open-Meteo defaults).
- Define number formatting (e.g., temperature rounded to nearest integer, wind to one decimal).
- **Done when:** conventions written as a comment block at the top of `js/ui.js`.

**Milestone 0 exit criteria:** skeleton loads cleanly in Chrome; both API endpoints proven to return every metric FR-2 needs without any key.

---

## Milestone 1 — API Layer & Single-City Weather (Core Functionality)

**Goal:** A user can type a city name and see its current weather.
**Requirements covered:** FR-1, FR-2, FR-3, TR-1, TR-2

### Task 1.1 — Implement geocoding function (`js/api.js`)
- `async function geocodeCity(name)`:
  - Trim input; reject empty/whitespace-only input before making a request.
  - Call the geocoding endpoint with `count=5`.
  - Return the top match as `{ name, country, latitude, longitude }`.
  - Throw a typed error `CityNotFoundError` when `results` is empty/absent (drives FR-3).
  - Throw `NetworkError` on fetch failure or non-2xx status.
- **Done when:** calling `geocodeCity("London")` from the DevTools console returns coordinates; `geocodeCity("zzzzqqq")` throws `CityNotFoundError`.

### Task 1.2 — Implement weather fetch function (`js/api.js`)
- `async function fetchWeather(latitude, longitude)`:
  - Request `current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`.
  - Return `{ temperature, humidity, windSpeed, weatherCode }` (FR-2's four metrics).
  - Throw `NetworkError` on failure.
- Compose `async function getCityWeather(cityName)` = geocode → fetch, returning `{ city: {name, country}, weather: {...} }`.
- **Done when:** `getCityWeather("Tokyo")` in the console returns a complete object with all four metrics populated.

### Task 1.3 — Build the search UI (`index.html`, `js/app.js`)
- Search form: text input (`aria-label="City name"`) + submit button; Enter key submits (FR-1).
- On submit: show a loading state, call `getCityWeather`, render result or error.
- Disable the submit button while a request is in flight to prevent duplicate requests.
- **Done when:** typing "Paris" and pressing Enter displays Paris's weather card.

### Task 1.4 — Render the weather card (`js/ui.js`)
- Card shows: city name + country, condition **icon** (placeholder until Milestone 2), temperature, humidity, wind speed (FR-2).
- Humidity and wind get small inline icons with `aria-label`s where text labels are omitted (FR-6/FR-7 groundwork).
- **Done when:** card renders all FR-2 metrics for any successfully searched city.

### Task 1.5 — Error handling (`js/ui.js`, `js/app.js`) — FR-3
- `CityNotFoundError` → message: *"We couldn't find that city. Check the spelling and try again."*
- `NetworkError` → message: *"Couldn't reach the weather service. Check your connection and try again."*
- Errors render in a styled, dismissable banner (`role="alert"`); no raw error text, stack traces, or HTTP codes shown.
- Previous results stay visible when a new search errors (don't blank the screen).
- **Done when:** searching gibberish shows the not-found message; searching with DevTools "Offline" mode shows the network message; neither shows technical detail.

**Milestone 1 exit criteria:** FR-1, FR-2, FR-3 demonstrably work in Chrome for happy path, unknown city, and offline cases.

---

## Milestone 2 — Icon System for Weather Conditions

**Goal:** Conditions shown by icon, never text, and accessible.
**Requirements covered:** FR-6, FR-7

### Task 2.1 — Map WMO weather codes to icon categories (`js/icons.js`)
- Group all WMO codes into ~9 categories:
  | Codes | Category | Icon |
  |---|---|---|
  | 0 | Clear | sun |
  | 1, 2 | Partly cloudy | sun behind cloud |
  | 3 | Overcast | cloud |
  | 45, 48 | Fog | fog lines |
  | 51–57 | Drizzle | cloud with light drops |
  | 61–67, 80–82 | Rain | cloud with rain |
  | 71–77, 85, 86 | Snow | cloud with snowflakes |
  | 95–99 | Thunderstorm | cloud with lightning |
  | (any unmapped code) | Unknown | generic cloud (safe fallback) |
- Export `getIcon(weatherCode)` returning `{ svg, label }` where `label` is a human-readable description (e.g., "Light rain").
- **Done when:** every code 0–99 resolves to a category (unit-check by looping over 0–99 in the console; zero `undefined` results).

### Task 2.2 — Create the SVG icons (`js/icons.js`)
- Inline SVGs (no icon-font or external dependency), one per category, consistent stroke width and 64×64 viewBox.
- Each icon rendered with `role="img"` and `aria-label` set from `getIcon().label` (FR-7).
- Small metric icons (droplet for humidity, wind lines for wind speed) also get `aria-label`s.
- **Done when:** all 9 condition icons + 2 metric icons render crisply at card size and at compare-view size.

### Task 2.3 — Wire icons into the weather card
- Replace the Milestone 1 placeholder with the mapped icon; verify **no visible text** names the condition anywhere in the card (FR-6).
- **Done when:** searching cities currently experiencing different conditions (pick from a world weather map) shows distinct, correct icons; Chrome DevTools accessibility pane shows the label on each icon.

**Milestone 2 exit criteria:** FR-6 and FR-7 verified — conditions are icon-only visually, fully labeled in the accessibility tree.

---

## Milestone 3 — Two-City Compare View

**Goal:** Side-by-side comparison of two cities.
**Requirements covered:** FR-4, FR-5, UI-3

### Task 3.1 — View switching (`js/app.js`, `index.html`)
- Add a single toggle/tab control in the header: **Single** | **Compare**. One click reaches the compare view from the main screen (UI-3).
- Switching views preserves any already-fetched data (no refetch on toggle).
- **Done when:** compare view is reachable in exactly one click and back again.

### Task 3.2 — Dual search inputs
- Compare view has two labeled inputs ("City A", "City B") and one "Compare" action; Enter in either input triggers it.
- Both cities fetch **in parallel** (`Promise.all` with individual error capture so one failure doesn't sink the other).
- Per-city errors: if only City B fails, City A's card still renders and the error banner names which city failed (FR-3 consistency).
- **Done when:** entering two valid cities renders both; entering one valid + one gibberish renders the valid one plus a city-specific error.

### Task 3.3 — Aligned side-by-side layout (FR-5)
- Two-column CSS grid; each metric occupies the same row in both columns so values align horizontally (temperature next to temperature, etc.).
- Same metrics as single view: icon, temperature, humidity, wind speed.
- Add a subtle visual cue for the larger value per row (e.g., slightly bolder temperature on the warmer city) to make differences scannable — keep it minimal per UI-1.
- On narrow windows the columns stack vertically but keep per-city card integrity (UI-2).
- **Done when:** with two cities loaded, every metric pair sits on one visual row at desktop width; layout doesn't break down to ~700 px width.

**Milestone 3 exit criteria:** FR-4, FR-5, UI-3 demonstrably work, including partial-failure handling.

---

## Milestone 4 — Visual Design Polish

**Goal:** The "simple, modern, clean" bar is actually met, not just claimed.
**Requirements covered:** UI-1, UI-2

### Task 4.1 — Design system pass (`css/style.css`)
- Define CSS custom properties: one accent color, neutral grays, max two font sizes for body/headings (system font stack — no webfont dependency).
- Generous whitespace: consistent spacing scale (e.g., 8 px base), cards with soft radius and subtle shadow.
- Remove any visual element that doesn't serve a requirement (UI-1: minimal clutter).
- **Done when:** the whole UI uses ≤ 1 accent color + neutrals, and spacing comes only from the defined scale.

### Task 4.2 — Responsive verification (UI-2)
- Test in Chrome at common desktop sizes: 1920×1080, 1440×900, 1280×720, and a narrow ~800 px window.
- Fix any overflow, wrapping, or misalignment found.
- **Done when:** no horizontal scrollbar and no broken layout at any of the four widths, in both views.

### Task 4.3 — Interaction states
- Loading: skeleton or spinner on cards while fetching.
- Focus-visible outlines on input/buttons (keyboard usability, supports FR-7's accessibility spirit).
- Hover/active states on the view toggle and buttons.
- **Done when:** every interactive element has visible focus, hover, and disabled states.

**Milestone 4 exit criteria:** UI-1 and UI-2 hold up under the size matrix in Task 4.2.

---

## Milestone 5 — Testing & Acceptance in Chrome

**Goal:** Every requirement verified in the target browser; the manual test pass required by TS-2 is executed and recorded.
**Requirements covered:** TS-1, TS-2 (and final verification of all FR/UI/TR items)

### Task 5.1 — Write the manual test script (`testing.md`)
Create a checklist with expected results, covering at minimum (TS-2):
1. **City search:** search "Berlin" → card with icon, temp, humidity, wind (FR-1, FR-2).
2. **Unknown city:** search "asdfgh" → friendly not-found message, no technical text (FR-3).
3. **Network failure:** DevTools → Offline → search → friendly network message (FR-3).
4. **Compare view:** one click to reach it (UI-3); compare "Oslo" vs "Cairo" → aligned rows, both icons correct (FR-4, FR-5, FR-6).
5. **Partial failure:** compare "Oslo" vs "qqqqq" → Oslo renders, city-specific error shown.
6. **Icon rendering:** verify distinct icons across ≥ 3 different current conditions; verify icon-only (no condition text) (FR-6).
7. **Accessibility:** Chrome DevTools accessibility tree shows labels for every icon (FR-7); tab through all controls with keyboard.
8. **Responsive:** run the Task 4.2 size matrix (UI-2).
9. **No-key check:** DevTools Network tab — confirm no request carries an API key or hits a paid endpoint (TR-1, TR-2, TR-3).
- **Done when:** `testing.md` exists with all steps and expected outcomes.

### Task 5.2 — Execute the test pass in Chrome (TS-1)
- Run every step from Task 5.1 in Google Chrome; mark pass/fail with notes in `testing.md`.
- **Done when:** all steps pass, or failures are logged as fix tasks.

### Task 5.3 — Fix-and-retest loop
- Fix every failure from 5.2; re-run only the affected steps plus any step touching the changed code.
- **Done when:** a clean full pass is recorded in `testing.md` with the date.

### Task 5.4 — Requirements traceability check
- Walk requirements.md top to bottom; for each ID (FR-1…FR-7, UI-1…UI-3, TR-1…TR-3, TS-1, TS-2) note where it's implemented and which test step proves it.
- Confirm out-of-scope items (forecasts, accounts, native apps) were **not** accidentally built.
- **Done when:** every requirement ID maps to code + a passing test step; the matrix is appended to `testing.md`.

**Milestone 5 exit criteria:** clean recorded Chrome test pass + complete traceability matrix. **Project done.**

---

## Requirements → Milestone Traceability

| Requirement | Milestone / Task |
|---|---|
| FR-1 city search | M1: 1.1–1.3 |
| FR-2 metrics displayed | M1: 1.2, 1.4 |
| FR-3 friendly errors | M1: 1.5; M3: 3.2 |
| FR-4 two-city compare | M3: 3.1–3.3 |
| FR-5 aligned compare layout | M3: 3.3 |
| FR-6 icon-only conditions | M2: 2.1–2.3 |
| FR-7 accessible icon labels | M2: 2.2; M5: 5.1 step 7 |
| UI-1 simple/modern/clean | M4: 4.1 |
| UI-2 responsive desktop | M4: 4.2; M5: 5.1 step 8 |
| UI-3 one-click compare access | M3: 3.1 |
| TR-1 free weather API | M0: 0.2; M1: 1.2 |
| TR-2 free geocoding API | M0: 0.2; M1: 1.1 |
| TR-3 no keys/paid services | M0: 0.2; M5: 5.1 step 9 |
| TS-1 Chrome as test browser | M5: 5.2 |
| TS-2 manual test coverage | M5: 5.1–5.3 |

## Suggested execution order & parallelism

- Milestones run 0 → 1 → 2 → 3 → 4 → 5 strictly in order, **except**:
  - Task 2.1/2.2 (icon mapping + SVGs) can start in parallel with Milestone 1 — they have no dependency on the API layer.
  - Task 5.1 (writing the test script) can be drafted any time after Milestone 3.
- Definition of done for the whole project = Milestone 5 exit criteria.
