// Injects and manages dark mode styles on the page

const STYLE_ID = "dme-style";
const ATTR_FLAG = "data-dme";
let currentEnabled = false;
let currentTheme = null;

function getHost(href) {
  const u = new URL(href || location.href);
  return u.hostname.replace(/^www\./, "");
}

function ensureStyleTag() {
  let style = document.getElementById(STYLE_ID);
  if (style) return style;
  style = document.createElement("style");
  style.id = STYLE_ID;
  style.type = "text/css";
  style.textContent = baseCSS();
  document.documentElement.appendChild(style);
  return style;
}

function baseCSS() {
  // Uses CSS variables so we can live-update without re-injecting CSS
  return `
:root { color-scheme: dark; }
html[${ATTR_FLAG}="on"] {
  background: var(--dme-bg, #121212) !important;
}
html[${ATTR_FLAG}="on"], html[${ATTR_FLAG}="on"] body {
  /* No content needed, just selector */
}

html[${ATTR_FLAG}="on"], html[${ATTR_FLAG}="on"] body,
html[${ATTR_FLAG}="on"] *:not(svg):not(img):not(video):not(canvas):not([role="img"]) {
  background-color: var(--dme-bg, #121212) !important;
  color: var(--dme-text, #e5e7eb) !important;
  border-color: var(--dme-border, #334155) !important;
}

html[${ATTR_FLAG}="on"] a { color: var(--dme-link, #93c5fd) !important; }
html[${ATTR_FLAG}="on"] ::selection { background: var(--dme-accent, #ef4444); color: #fff; }

/* Surfaces, inputs, cards */
html[${ATTR_FLAG}="on"] input,
html[${ATTR_FLAG}="on"] textarea,
html[${ATTR_FLAG}="on"] select,
html[${ATTR_FLAG}="on"] button {
  background-color: var(--dme-surface, #1e293b) !important;
  color: var(--dme-text, #e5e7eb) !important;
  border-color: var(--dme-border, #334155) !important;
}

/* Media stays readable */
html[${ATTR_FLAG}="on"] img,
html[${ATTR_FLAG}="on"] video,
html[${ATTR_FLAG}="on"] canvas,
html[${ATTR_FLAG}="on"] picture {
  filter: brightness(var(--dme-brightness, 1)) contrast(var(--dme-contrast, 1.05)) !important;
  background: transparent !important;
}

/* Override super-bright backgrounds commonly used */
html[${ATTR_FLAG}="on"] [style*="background:#fff"],
html[${ATTR_FLAG}="on"] [style*="background: #fff"],
html[${ATTR_FLAG}="on"] [style*="background-color:#fff"],
html[${ATTR_FLAG}="on"] [style*="background-color: #fff"] {
  background-color: var(--dme-bg, #121212) !important;
}

/* Respect code areas */
html[${ATTR_FLAG}="on"] pre, html[${ATTR_FLAG}="on"] code, html[${ATTR_FLAG}="on"] kbd {
  background-color: color-mix(in srgb, var(--dme-surface, #1e293b) 80%, black) !important;
  color: var(--dme-text, #e5e7eb) !important;
}

/* Optional: softened shadows to avoid halo artifacts */
html[${ATTR_FLAG}="on"] * {
  box-shadow: none !important;
}
`;
}

function applyThemeVars(theme) {
  const root = document.documentElement;
  const t = {
    bg: "#121212",
    surface: "#1e293b",
    text: "#e5e7eb",
    link: "#93c5fd",
    accent: "#ef4444",
    border: "#334155",
    brightness: 1.0,
    contrast: 1.05,
    font: "system-ui",
    ...(theme || {})
  };
  root.style.setProperty("--dme-bg", t.bg);
  root.style.setProperty("--dme-surface", t.surface);
  root.style.setProperty("--dme-text", t.text);
  root.style.setProperty("--dme-link", t.link);
  root.style.setProperty("--dme-accent", t.accent);
  root.style.setProperty("--dme-border", t.border);
  root.style.setProperty("--dme-brightness", String(t.brightness));
  root.style.setProperty("--dme-contrast", String(t.contrast));
  if (t.font) root.style.setProperty("--dme-font", t.font);

  // Optional global font (kept minimal to avoid layout breakage)
  if (!document.getElementById("dme-font-style")) {
    const s = document.createElement("style");
    s.id = "dme-font-style";
    s.textContent = `
      html[${ATTR_FLAG}="on"] { font-family: var(--dme-font, system-ui), ui-sans-serif, sans-serif !important; }
    `;
    document.documentElement.appendChild(s);
  }
}

function withinSchedule(schedule) {
  if (!schedule?.enabled) return true; // if schedule disabled, allow based on toggles
  const now = new Date();
  const [sh, sm] = schedule.start.split(":").map(Number);
  const [eh, em] = schedule.end.split(":").map(Number);
  const start = new Date(now); start.setHours(sh, sm, 0, 0);
  const end = new Date(now);   end.setHours(eh, em, 0, 0);

  if (schedule.start === schedule.end) return true; // 24/7 window
  if (end > start) {
    // same-day window
    return now >= start && now <= end;
  } else {
    // overnight window
    return (now >= start) || (now <= end);
  }
}

async function readSettings() {
  const all = await chrome.storage.sync.get(null);
  const host = getHost();
  const site = all.sites?.[host];
  const global = all.global || {};
  return { host, site, global };
}

async function decideEnable() {
  const { site, global } = await readSettings();
  const perSite = site?.enabled;
  const defaultOn = !!global.enabledByDefault;

  const scheduleOK = withinSchedule(global.schedule);

  // Priority: explicit per-site setting; otherwise default + schedule
  return (typeof perSite === "boolean" ? perSite : defaultOn) && scheduleOK;
}

async function enable() {
  ensureStyleTag();
  const { site, global } = await readSettings();
  const theme = { ...(global.theme || {}), ...(site?.theme || {}) };
  applyThemeVars(theme);
  document.documentElement.setAttribute(ATTR_FLAG, "on");
  currentEnabled = true;
  currentTheme = theme;
}

function disable() {
  document.documentElement.removeAttribute(ATTR_FLAG);
  currentEnabled = false;
}

async function init() {
  try {
    const should = await decideEnable();
    if (should) enable();
  } catch (e) {
    console.error("Dark Mode Everywhere init error:", e);
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("Content script received message:", msg.type);
  
  if (msg?.type === "TOGGLE") {
    if (currentEnabled) {
      disable();
    } else {
      enable();
    }
    sendResponse({ enabled: currentEnabled });
    return true;
  }

  if (msg?.type === "APPLY_THEME") {
    console.log("Applying theme:", msg.theme);
    ensureStyleTag();
    applyThemeVars(msg.theme || {});
    document.documentElement.setAttribute(ATTR_FLAG, "on");
    currentEnabled = true;
    currentTheme = msg.theme;
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === "GET_STATE") {
    sendResponse({ enabled: currentEnabled, theme: currentTheme });
    return true;
  }
  
  return false;
});

// Initialize
init();