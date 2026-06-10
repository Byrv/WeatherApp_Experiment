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
