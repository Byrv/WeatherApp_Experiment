# Weather App — Execution Script

This document is the executable companion to [plan.md](plan.md). Followed top to bottom, it builds, runs, and tests the complete application. Each step states:

- **Prompt** — the instruction driving the step (what you'd tell the agent/yourself)
- **Tool call** — the exact tool and parameters (`Write` with full file content, `PowerShell` commands, Chrome browser tools)
- **Verify** — how to confirm the step succeeded before moving on

Working directory for all steps: `E:\experiment\execution1`

---

## Milestone 0 — Project Setup & API Validation

### Step 0.1 — Scaffold project structure (Task 0.1)

**Prompt:** "Create the project skeleton: index.html shell with header, view toggle, single and compare sections; empty css/js files wired in."

**Tool call:** `Write` → `E:\experiment\execution1\index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="app-header">
    <h1>Weather</h1>
    <nav class="view-toggle" role="tablist" aria-label="View">
      <button id="tab-single" role="tab" aria-selected="true" class="active">Single</button>
      <button id="tab-compare" role="tab" aria-selected="false">Compare</button>
    </nav>
  </header>

  <main>
    <div id="error-banner" class="error-banner hidden" role="alert">
      <span id="error-text"></span>
      <button id="error-dismiss" aria-label="Dismiss error">&times;</button>
    </div>

    <!-- Single-city view -->
    <section id="view-single" class="view">
      <form id="search-form" class="search-form">
        <input id="city-input" type="text" aria-label="City name"
               placeholder="Search for a city…" autocomplete="off">
        <button id="search-btn" type="submit">Search</button>
      </form>
      <div id="single-card" class="card-slot"></div>
    </section>

    <!-- Compare view -->
    <section id="view-compare" class="view hidden">
      <form id="compare-form" class="search-form compare-form">
        <input id="city-a-input" type="text" aria-label="City A"
               placeholder="City A" autocomplete="off">
        <input id="city-b-input" type="text" aria-label="City B"
               placeholder="City B" autocomplete="off">
        <button id="compare-btn" type="submit">Compare</button>
      </form>
      <div class="compare-grid">
        <div id="compare-card-a" class="card-slot"></div>
        <div id="compare-card-b" class="card-slot"></div>
      </div>
    </section>
  </main>

  <script src="js/icons.js"></script>
  <script src="js/api.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

**Tool calls (placeholders, replaced in later steps):** `Write` empty-comment stubs to `css/style.css`, `js/api.js`, `js/icons.js`, `js/ui.js`, `js/app.js` so the page loads with zero 404s. Example stub content: `/* filled in Milestone N */`.

**Verify:** open the page (Step 0.2 starts the server) — empty shell, no console errors.

### Step 0.2 — Start a local server and validate the Open-Meteo endpoints (Task 0.2)

**Prompt:** "Serve the directory on localhost and confirm both Open-Meteo endpoints return the metrics FR-2 needs, with no API key."

**Tool call:** `PowerShell` (run_in_background: true)

```powershell
python -m http.server 8000 --directory E:\experiment\execution1
```

(If Python is unavailable: `npx serve -l 8000 E:\experiment\execution1`.)

**Tool call:** `PowerShell` — validate endpoints from the CLI before any code depends on them:

```powershell
Invoke-RestMethod "https://geocoding-api.open-meteo.com/v1/search?name=London&count=5" |
  Select-Object -ExpandProperty results | Select-Object -First 1 name, country, latitude, longitude
```

```powershell
Invoke-RestMethod "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" |
  Select-Object -ExpandProperty current
```

**Verify:**
- First command returns `name=London` with latitude/longitude.
- Second returns all four fields: `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `weather_code`.
- Neither URL contains a key (TR-3 ✓).

### Step 0.3 — Formatting conventions (Task 0.3)

Conventions (recorded as the comment block at the top of `js/ui.js`, written in Step 1.4):
- Temperature: °C, rounded to nearest integer.
- Wind: km/h, one decimal.
- Humidity: integer %.

**Milestone 0 exit check:** server running; both endpoints proven; shell loads.

---

## Milestone 1 — API Layer & Single-City Weather

### Step 1.1 + 1.2 — API layer (Tasks 1.1, 1.2)

**Prompt:** "Implement geocodeCity, fetchWeather, getCityWeather with typed errors CityNotFoundError / NetworkError."

**Tool call:** `Write` → `E:\experiment\execution1\js\api.js`

```javascript
// API layer — Open-Meteo (free, no API key: TR-1, TR-2, TR-3)
//
// Sample geocoding response (validated Milestone 0):
//   { results: [{ name: "London", country: "United Kingdom",
//                 latitude: 51.50853, longitude: -0.12574, ... }] }
// Sample forecast response:
//   { current: { temperature_2m: 18.3, relative_humidity_2m: 65,
//                wind_speed_10m: 12.4, weather_code: 3 } }

class CityNotFoundError extends Error {
  constructor(query) { super(`City not found: ${query}`); this.name = "CityNotFoundError"; }
}
class NetworkError extends Error {
  constructor(detail) { super(`Network error: ${detail}`); this.name = "NetworkError"; }
}

async function geocodeCity(name) {
  const query = (name || "").trim();
  if (!query) throw new CityNotFoundError("(empty input)");
  let res;
  try {
    res = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(query) + "&count=5"
    );
  } catch (e) {
    throw new NetworkError("geocoding request failed");
  }
  if (!res.ok) throw new NetworkError("geocoding HTTP " + res.status);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new CityNotFoundError(query);
  const top = data.results[0];
  return {
    name: top.name,
    country: top.country || "",
    latitude: top.latitude,
    longitude: top.longitude,
  };
}

async function fetchWeather(latitude, longitude) {
  let res;
  try {
    res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + latitude +
      "&longitude=" + longitude +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
    );
  } catch (e) {
    throw new NetworkError("weather request failed");
  }
  if (!res.ok) throw new NetworkError("weather HTTP " + res.status);
  const data = await res.json();
  const c = data.current;
  return {
    temperature: c.temperature_2m,   // °C
    humidity: c.relative_humidity_2m, // %
    windSpeed: c.wind_speed_10m,      // km/h
    weatherCode: c.weather_code,      // WMO code
  };
}

// FR-1 + FR-2: city name in, full weather record out.
async function getCityWeather(cityName) {
  const city = await geocodeCity(cityName);
  const weather = await fetchWeather(city.latitude, city.longitude);
  return { city, weather };
}
```

**Verify (DevTools console at `http://localhost:8000`):**
- `await getCityWeather("Tokyo")` → object with all four metrics.
- `await geocodeCity("zzzzqqq")` → throws `CityNotFoundError`.

### Step 1.4 — UI rendering layer (Task 1.4 + 1.5 rendering half)

**Prompt:** "Implement the weather card renderer, error banner, and loading state."

**Tool call:** `Write` → `E:\experiment\execution1\js\ui.js`

```javascript
// UI rendering layer.
//
// Formatting conventions (Task 0.3):
//   temperature — °C, rounded to nearest integer
//   wind speed  — km/h, one decimal
//   humidity    — integer %

function formatTemp(t) { return Math.round(t) + "°C"; }
function formatWind(w) { return w.toFixed(1) + " km/h"; }
function formatHumidity(h) { return Math.round(h) + "%"; }

// FR-2 metrics; FR-6 icon-only condition; FR-7 aria-labels.
function weatherCardHTML(result) {
  const { city, weather } = result;
  const icon = getIcon(weather.weatherCode); // from icons.js
  return (
    '<article class="weather-card">' +
      '<h2 class="card-city">' + escapeHTML(city.name) +
        '<span class="card-country">' + escapeHTML(city.country) + '</span></h2>' +
      '<div class="card-condition" role="img" aria-label="' + icon.label + '">' +
        icon.svg + '</div>' +
      '<p class="card-temp" data-metric="temperature">' + formatTemp(weather.temperature) + '</p>' +
      '<dl class="card-metrics">' +
        '<div class="metric"><dt>' + METRIC_ICONS.humidity + '</dt>' +
          '<dd data-metric="humidity">' + formatHumidity(weather.humidity) + '</dd></div>' +
        '<div class="metric"><dt>' + METRIC_ICONS.wind + '</dt>' +
          '<dd data-metric="wind">' + formatWind(weather.windSpeed) + '</dd></div>' +
      '</dl>' +
    '</article>'
  );
}

function renderCard(slotEl, result) {
  slotEl.innerHTML = weatherCardHTML(result);
}

function renderLoading(slotEl) {
  slotEl.innerHTML = '<div class="card-skeleton" aria-label="Loading"></div>';
}

function clearSlot(slotEl) { slotEl.innerHTML = ""; }

// FR-3: friendly messages only — no raw errors, codes, or stacks.
function errorMessageFor(err, cityLabel) {
  const prefix = cityLabel ? cityLabel + ": " : "";
  if (err instanceof CityNotFoundError) {
    return prefix + "We couldn't find that city. Check the spelling and try again.";
  }
  return prefix + "Couldn't reach the weather service. Check your connection and try again.";
}

function showError(message) {
  document.getElementById("error-text").textContent = message;
  document.getElementById("error-banner").classList.remove("hidden");
}

function hideError() {
  document.getElementById("error-banner").classList.add("hidden");
}

// Compare view scannability cue (Task 3.3): bold the warmer temperature.
function highlightWarmer(slotA, slotB, tempA, tempB) {
  const a = slotA.querySelector('[data-metric="temperature"]');
  const b = slotB.querySelector('[data-metric="temperature"]');
  if (!a || !b || tempA === tempB) return;
  (tempA > tempB ? a : b).classList.add("metric-leader");
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
```

### Step 1.3 + 1.5 — App wiring with error handling (Tasks 1.3, 1.5)

**Prompt:** "Wire the search form: loading state, fetch, render or friendly error; keep previous results on error; disable button in flight."

**Tool call:** `Write` → `E:\experiment\execution1\js\app.js`

```javascript
// App wiring: events, view switching, request lifecycle.

document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("search-form");
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const singleSlot = document.getElementById("single-card");

  const compareForm = document.getElementById("compare-form");
  const cityAInput = document.getElementById("city-a-input");
  const cityBInput = document.getElementById("city-b-input");
  const compareBtn = document.getElementById("compare-btn");
  const slotA = document.getElementById("compare-card-a");
  const slotB = document.getElementById("compare-card-b");

  const tabSingle = document.getElementById("tab-single");
  const tabCompare = document.getElementById("tab-compare");
  const viewSingle = document.getElementById("view-single");
  const viewCompare = document.getElementById("view-compare");

  document.getElementById("error-dismiss").addEventListener("click", hideError);

  // --- View toggle (UI-3: one click; data preserved, no refetch) ---
  function switchView(toCompare) {
    viewSingle.classList.toggle("hidden", toCompare);
    viewCompare.classList.toggle("hidden", !toCompare);
    tabSingle.classList.toggle("active", !toCompare);
    tabCompare.classList.toggle("active", toCompare);
    tabSingle.setAttribute("aria-selected", String(!toCompare));
    tabCompare.setAttribute("aria-selected", String(toCompare));
    hideError();
  }
  tabSingle.addEventListener("click", function () { switchView(false); });
  tabCompare.addEventListener("click", function () { switchView(true); });

  // --- Single-city search (FR-1, FR-3) ---
  searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = cityInput.value.trim();
    if (!name) return;
    hideError();
    searchBtn.disabled = true;
    const hadCard = singleSlot.innerHTML !== "";
    if (!hadCard) renderLoading(singleSlot);
    try {
      const result = await getCityWeather(name);
      renderCard(singleSlot, result);
    } catch (err) {
      // FR-3: previous result stays visible; show friendly banner only.
      if (!hadCard) clearSlot(singleSlot);
      showError(errorMessageFor(err));
    } finally {
      searchBtn.disabled = false;
    }
  });

  // --- Compare (FR-4): parallel fetch, per-city failure isolation ---
  compareForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nameA = cityAInput.value.trim();
    const nameB = cityBInput.value.trim();
    if (!nameA || !nameB) {
      showError("Enter both cities to compare.");
      return;
    }
    hideError();
    compareBtn.disabled = true;
    renderLoading(slotA);
    renderLoading(slotB);

    const [resA, resB] = await Promise.allSettled([
      getCityWeather(nameA),
      getCityWeather(nameB),
    ]);
    const errors = [];

    if (resA.status === "fulfilled") renderCard(slotA, resA.value);
    else { clearSlot(slotA); errors.push(errorMessageFor(resA.reason, nameA)); }

    if (resB.status === "fulfilled") renderCard(slotB, resB.value);
    else { clearSlot(slotB); errors.push(errorMessageFor(resB.reason, nameB)); }

    if (resA.status === "fulfilled" && resB.status === "fulfilled") {
      highlightWarmer(slotA, slotB,
        resA.value.weather.temperature, resB.value.weather.temperature);
    }
    if (errors.length) showError(errors.join(" "));
    compareBtn.disabled = false;
  });
});
```

**Verify (Chrome at `http://localhost:8000`):**
- Search "Paris" → card renders (icon is the Milestone-2 fallback until Step 2.1 lands).
- Search "asdfgh" → not-found banner, no technical text.
- DevTools → Network → Offline → search → network banner. Re-enable network after.

**Milestone 1 exit check:** FR-1, FR-2, FR-3 behaviors all observed.

---

## Milestone 2 — Icon System

### Step 2.1 + 2.2 — WMO code → SVG mapping (Tasks 2.1, 2.2)

**Prompt:** "Implement getIcon(code) covering all WMO codes 0–99 with a fallback, inline SVGs, plus humidity/wind metric icons with aria-labels."

**Tool call:** `Write` → `E:\experiment\execution1\js\icons.js`

```javascript
// Weather icons — FR-6 (icon-only conditions) + FR-7 (accessible labels).
// WMO weather codes grouped into 9 categories; any unmapped code → fallback.

const SVG_ATTRS = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" ' +
  'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

const ICON_SVGS = {
  clear:
    '<svg ' + SVG_ATTRS + '><circle cx="32" cy="32" r="11"/>' +
    '<path d="M32 8v6M32 50v6M8 32h6M50 32h6M14.9 14.9l4.3 4.3M44.8 44.8l4.3 4.3M49.1 14.9l-4.3 4.3M19.2 44.8l-4.3 4.3"/></svg>',
  partly:
    '<svg ' + SVG_ATTRS + '><circle cx="24" cy="24" r="9"/>' +
    '<path d="M24 8v4M8 24h4M12.7 12.7l2.8 2.8"/>' +
    '<path d="M28 46h18a8 8 0 0 0 0-16 12 12 0 0 0-23-3 8 8 0 0 0 5 19z" fill="#fff"/></svg>',
  overcast:
    '<svg ' + SVG_ATTRS + '><path d="M20 46h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/></svg>',
  fog:
    '<svg ' + SVG_ATTRS + '><path d="M20 34h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/>' +
    '<path d="M14 44h36M20 52h24"/></svg>',
  drizzle:
    '<svg ' + SVG_ATTRS + '><path d="M20 38h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/>' +
    '<path d="M24 46v3M34 46v3M44 46v3"/></svg>',
  rain:
    '<svg ' + SVG_ATTRS + '><path d="M20 36h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/>' +
    '<path d="M23 44l-3 8M33 44l-3 8M43 44l-3 8"/></svg>',
  snow:
    '<svg ' + SVG_ATTRS + '><path d="M20 36h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/>' +
    '<path d="M24 46v.1M34 46v.1M44 46v.1M29 53v.1M39 53v.1"/></svg>',
  thunder:
    '<svg ' + SVG_ATTRS + '><path d="M20 34h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/>' +
    '<path d="M33 38l-7 11h8l-4 9 11-13h-8l5-7z"/></svg>',
  unknown:
    '<svg ' + SVG_ATTRS + '><path d="M20 42h26a9 9 0 0 0 0-18 14 14 0 0 0-27-3 9 9 0 0 0 1 21z"/></svg>',
};

// [categoryKey, label, matcher]
const WMO_CATEGORIES = [
  ["clear",    "Clear sky",        function (c) { return c === 0; }],
  ["partly",   "Partly cloudy",    function (c) { return c === 1 || c === 2; }],
  ["overcast", "Overcast",         function (c) { return c === 3; }],
  ["fog",      "Fog",              function (c) { return c === 45 || c === 48; }],
  ["drizzle",  "Drizzle",          function (c) { return c >= 51 && c <= 57; }],
  ["rain",     "Rain",             function (c) { return (c >= 61 && c <= 67) || (c >= 80 && c <= 82); }],
  ["snow",     "Snow",             function (c) { return (c >= 71 && c <= 77) || c === 85 || c === 86; }],
  ["thunder",  "Thunderstorm",     function (c) { return c >= 95 && c <= 99; }],
];

function getIcon(weatherCode) {
  for (const [key, label, match] of WMO_CATEGORIES) {
    if (match(weatherCode)) return { svg: ICON_SVGS[key], label: label };
  }
  return { svg: ICON_SVGS.unknown, label: "Unknown conditions" };
}

// Metric icons (FR-7: labeled because no text label is shown).
const METRIC_ICONS = {
  humidity:
    '<span class="metric-icon" role="img" aria-label="Humidity">' +
    '<svg ' + SVG_ATTRS + '><path d="M32 10c8 11 16 19 16 28a16 16 0 0 1-32 0c0-9 8-17 16-28z"/></svg></span>',
  wind:
    '<span class="metric-icon" role="img" aria-label="Wind speed">' +
    '<svg ' + SVG_ATTRS + '><path d="M10 26h28a7 7 0 1 0-7-7M10 38h38a7 7 0 1 1-7 7M10 32h14"/></svg></span>',
};
```

**Verify (DevTools console):**

```javascript
// Task 2.1 done-check: every code 0–99 resolves; zero undefined.
Array.from({length: 100}, (_, c) => getIcon(c)).filter(i => !i || !i.svg).length // → 0
```

### Step 2.3 — Already wired (Task 2.3)

`weatherCardHTML` in `js/ui.js` (Step 1.4) already calls `getIcon` and renders icon-only conditions with `role="img"` + `aria-label`. Once Step 2.1's file is written, the placeholder concern disappears.

**Verify:** search 3 cities with different current conditions (e.g., pick from a live weather map: one clear, one rainy, one cloudy) → distinct icons; no visible condition text anywhere; DevTools → Elements → Accessibility pane shows each icon's label.

**Milestone 2 exit check:** FR-6 + FR-7 verified.

---

## Milestone 3 — Compare View

Steps 3.1 (view toggle), 3.2 (dual inputs, parallel fetch, per-city errors) were implemented in Step 1.3+1.5's `app.js` and Step 0.1's HTML. Remaining work is layout (Task 3.3) — delivered with all styling in Milestone 4's stylesheet to avoid writing `style.css` twice.

**Verify after Milestone 4's stylesheet lands:**
- Compare tab reachable in one click (UI-3).
- "Oslo" vs "Cairo" → both cards render, metrics row-aligned, warmer temp bolded.
- "Oslo" vs "qqqqq" → Oslo renders; banner reads "qqqqq: We couldn't find that city…".

---

## Milestone 4 — Visual Design

### Step 4.1 — Full stylesheet (Tasks 4.1, 4.3 + Task 3.3 layout)

**Prompt:** "Write the complete stylesheet: design tokens, card and compare-grid layout with aligned metric rows, skeleton loading, focus/hover/disabled states, responsive stacking."

**Tool call:** `Write` → `E:\experiment\execution1\css\style.css`

```css
/* Design tokens (UI-1): one accent + neutrals, 8px spacing scale,
   two type sizes, system font stack. */
:root {
  --accent: #2563eb;
  --bg: #f6f7f9;
  --surface: #ffffff;
  --text: #1f2937;
  --text-soft: #6b7280;
  --border: #e5e7eb;
  --danger-bg: #fef2f2;
  --danger-text: #b91c1c;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --s1: 8px; --s2: 16px; --s3: 24px; --s4: 32px;
  --fs-body: 16px;
  --fs-heading: 22px;
}

* { box-sizing: border-box; margin: 0; }

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--fs-body);
  color: var(--text);
  background: var(--bg);
}

/* --- Header + view toggle (UI-3) --- */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s2) var(--s3);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.app-header h1 { font-size: var(--fs-heading); }

.view-toggle { display: flex; gap: var(--s1); }
.view-toggle button {
  font: inherit;
  padding: var(--s1) var(--s2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-soft);
  cursor: pointer;
}
.view-toggle button:hover { border-color: var(--accent); color: var(--accent); }
.view-toggle button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

main { max-width: 880px; margin: 0 auto; padding: var(--s4) var(--s3); }

.hidden { display: none !important; }

/* --- Search forms --- */
.search-form { display: flex; gap: var(--s1); margin-bottom: var(--s3); }
.search-form input {
  font: inherit;
  flex: 1;
  padding: var(--s1) var(--s2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.search-form button {
  font: inherit;
  padding: var(--s1) var(--s3);
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}
.search-form button:hover { filter: brightness(1.1); }
.search-form button:disabled { opacity: 0.5; cursor: wait; }

/* Keyboard usability (Task 4.3) */
input:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* --- Error banner (FR-3) --- */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s2);
  padding: var(--s1) var(--s2);
  margin-bottom: var(--s3);
  background: var(--danger-bg);
  color: var(--danger-text);
  border-radius: var(--radius);
}
.error-banner button {
  font: inherit;
  border: none;
  background: none;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
}

/* --- Weather card (FR-2; fixed row order gives FR-5 alignment) --- */
.weather-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: var(--s3);
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto auto; /* city / icon / temp / metrics */
  gap: var(--s2);
}
.card-city { font-size: var(--fs-heading); }
.card-country {
  display: block;
  font-size: var(--fs-body);
  font-weight: normal;
  color: var(--text-soft);
}
.card-condition { color: var(--accent); }
.card-condition svg { width: 96px; height: 96px; }
.card-temp { font-size: 40px; font-weight: 600; }
.metric-leader { color: var(--accent); font-weight: 700; }

.card-metrics {
  display: flex;
  justify-content: center;
  gap: var(--s4);
  color: var(--text-soft);
}
.metric { display: flex; align-items: center; gap: var(--s1); }
.metric-icon svg { width: 22px; height: 22px; vertical-align: middle; }

/* --- Compare grid (FR-5): equal columns; identical card row
       templates keep each metric on the same visual row. --- */
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s3);
  align-items: stretch;
}
.compare-form input { min-width: 0; }

/* --- Loading skeleton (Task 4.3) --- */
.card-skeleton {
  height: 300px;
  border-radius: var(--radius);
  background: linear-gradient(90deg, var(--border) 25%, var(--surface) 50%, var(--border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* --- Responsive (UI-2): stack compare columns on narrow windows --- */
@media (max-width: 700px) {
  .compare-grid { grid-template-columns: 1fr; }
  .compare-form { flex-wrap: wrap; }
  .app-header { flex-direction: column; gap: var(--s1); }
}
```

### Step 4.2 — Responsive verification (Task 4.2)

**Prompt:** "Verify layout at 1920, 1440, 1280, and ~800 px in Chrome; fix any overflow."

**Tool calls (Chrome automation):**
1. `ToolSearch` query `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__computer`
2. `tabs_context_mcp` → get current tabs; `tabs_create_mcp` → new tab
3. `navigate` → `http://localhost:8000`
4. For each width in [1920, 1440, 1280, 800]: `resize_window` → screenshot via `computer` (action: screenshot) → inspect for horizontal scrollbars / broken layout, in **both** views.

**Verify:** no horizontal scrollbar, no overlapping elements at any width.

**Milestone 4 exit check:** UI-1 (tokens only), UI-2 (size matrix clean), interaction states present.

---

## Milestone 5 — Testing & Acceptance in Chrome

### Step 5.1 — Write the manual test script (Task 5.1)

**Tool call:** `Write` → `E:\experiment\execution1\testing.md`

```markdown
# Weather App — Chrome Test Pass (TS-1, TS-2)

Server: `python -m http.server 8000` → http://localhost:8000
Browser: Google Chrome. Date: ____  Result: PASS / FAIL per step.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Search "Berlin" | Card: icon, temp °C, humidity %, wind km/h (FR-1, FR-2) | |
| 2 | Search "asdfgh" | "We couldn't find that city…" — no technical text (FR-3) | |
| 3 | DevTools Offline → search "Paris" | "Couldn't reach the weather service…" (FR-3); previous card still visible | |
| 4 | Click "Compare" tab | Compare view in one click (UI-3) | |
| 5 | Compare "Oslo" vs "Cairo" | Both cards; metric rows aligned; warmer temp highlighted (FR-4, FR-5) | |
| 6 | Compare "Oslo" vs "qqqqq" | Oslo renders; banner names "qqqqq" (FR-3) | |
| 7 | Search 3 cities with different conditions | 3 distinct icons; zero visible condition text (FR-6) | |
| 8 | DevTools Accessibility pane on each icon | aria-label present: condition + Humidity + Wind speed (FR-7) | |
| 9 | Tab key through all controls | Visible focus ring on every control | |
| 10 | Resize: 1920 / 1440 / 1280 / 800 px, both views | No horizontal scroll, no broken layout (UI-2) | |
| 11 | DevTools Network tab, full session | Only open-meteo.com requests; no API key in any URL (TR-1–TR-3) | |

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
```

### Step 5.2 — Execute the test pass (Task 5.2, TS-1)

**Prompt:** "Run every step of testing.md in Chrome via browser automation; record pass/fail."

**Tool calls (Chrome automation, tools loaded in Step 4.2 plus):**
- `ToolSearch` query `select:mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__get_page_text`

Per test step:
1. **Step 1:** `computer` → click `#city-input`, type "Berlin", press Enter; `read_page` → assert card contains temperature, humidity, wind values and an SVG icon.
2. **Step 2:** type "asdfgh", Enter; `get_page_text` → assert banner text matches the friendly message and contains no "Error", "404", or stack text.
3. **Step 3:** offline simulation isn't available via the extension — perform this one step manually in DevTools (Network → Offline), or skip-with-note. Record outcome.
4. **Steps 4–6:** click `#tab-compare`; fill `#city-a-input` / `#city-b-input`; submit; `read_page` → assert both cards / one card + named error.
5. **Step 7–8:** `read_page` (filter: interactive/images) → assert `role="img"` nodes with aria-labels; assert no condition word appears as visible text in cards.
6. **Step 9:** `shortcuts_execute` or keyboard via `computer` Tab presses; screenshot to confirm focus ring.
7. **Step 10:** repeat the Step 4.2 resize loop.
8. **Step 11:** `read_network_requests` → assert every request host ends in `open-meteo.com` (plus localhost) and no `key=`/`appid=`/`token=` parameter appears.
9. `read_console_messages` → assert zero uncaught errors across the whole session.

**Tool call:** `Edit` → `testing.md` — fill the Result column with PASS/FAIL + notes and the date.

### Step 5.3 — Fix-and-retest loop (Task 5.3)

For each FAIL: diagnose → `Edit` the offending file → re-run that test step + any step touching the same file → update `testing.md`. Repeat until the table is all PASS.

### Step 5.4 — Traceability check (Task 5.4)

Walk requirements.md ID by ID against the matrix already embedded in `testing.md`; correct any gaps. Confirm the out-of-scope line.

**Milestone 5 exit check / project done:** `testing.md` records a dated, all-PASS run with the completed traceability matrix.

---

## Appendix A — Complete file manifest

| File | Written in step | Purpose |
|---|---|---|
| `index.html` | 0.1 | Page shell, both views, error banner |
| `css/style.css` | 4.1 | Tokens, card + compare layout, states, responsive |
| `js/api.js` | 1.1 | Geocoding + weather fetch, typed errors |
| `js/icons.js` | 2.1 | WMO code → SVG + label, metric icons |
| `js/ui.js` | 1.4 | Card/error/loading rendering, formatting |
| `js/app.js` | 1.3 | Event wiring, view toggle, compare flow |
| `testing.md` | 5.1 | Executable Chrome test checklist + traceability |

## Appendix B — Quick-start (re-run anytime)

```powershell
python -m http.server 8000 --directory E:\experiment\execution1
# then open http://localhost:8000 in Chrome
```

## Appendix C — Execution order summary

0.1 → 0.2 → 1.1/1.2 → 1.4 → 1.3/1.5 → 2.1/2.2 → (2.3 auto) → 4.1 → 4.2 → 3.x verify → 5.1 → 5.2 → 5.3 → 5.4

(Icon work 2.1/2.2 may run in parallel with Milestone 1, per plan.md.)
