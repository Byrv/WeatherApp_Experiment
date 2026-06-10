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
