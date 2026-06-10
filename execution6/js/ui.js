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
