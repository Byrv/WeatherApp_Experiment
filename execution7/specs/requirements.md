# Weather App — Requirements

## 1. Overview

A web-based weather application that lets users view current weather conditions for a city and compare conditions between two cities side by side.

## 2. Functional Requirements

### 2.1 Weather Lookup
- **FR-1**: The user can search for a city by name and view its current weather.
- **FR-2**: Displayed data must include, at minimum: temperature, weather condition (e.g., clear, cloudy, rain), humidity, and wind speed.
- **FR-3**: If a city is not found or the API request fails, the app shows a clear, non-technical error message.

### 2.2 City Comparison
- **FR-4**: The user can select two cities and view their weather side by side in a compare view.
- **FR-5**: The compare view presents the same metrics for both cities in an aligned layout so differences are easy to scan.

### 2.3 Condition Display
- **FR-6**: Weather conditions are conveyed with icons rather than text labels (e.g., a sun icon for clear skies, a cloud-with-rain icon for rain).
- **FR-7**: Icons must include accessible alternatives (`alt` text or `aria-label`) so the meaning is available to screen readers even though no visible text is shown.

## 3. UI / Design Requirements

- **UI-1**: The interface is simple, modern, and clean — minimal visual clutter, generous whitespace, and a restrained color palette.
- **UI-2**: The layout is responsive and usable on common desktop window sizes.
- **UI-3**: The compare view is reachable from the main screen without complex navigation (one click/tap at most).

## 4. Technical Requirements

- **TR-1**: Weather data must come from open-source or free, no-cost public APIs (e.g., [Open-Meteo](https://open-meteo.com/), which requires no API key).
- **TR-2**: City name lookup (geocoding) must also use a free/open API (Open-Meteo provides a geocoding endpoint).
- **TR-3**: No paid services, accounts, or secret API keys may be required to run the app.

## 5. Testing Requirements

- **TS-1**: The application is tested in Google Chrome as the primary target browser.
- **TS-2**: Manual test pass in Chrome must cover: city search, error handling for unknown cities, the two-city compare view, and icon rendering.

## 6. Out of Scope (initial version)

- Multi-day forecasts
- User accounts or saved preferences
- Mobile-native apps
