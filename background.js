// Initialize sensible defaults on install
const DEFAULTS = {
  global: {
    enabledByDefault: false,
    schedule: { enabled: false, start: "19:00", end: "07:00" },
    theme: {
      bg: "#121212",
      surface: "#1e293b",
      text: "#e5e7eb",
      link: "#93c5fd",
      accent: "#ef4444",
      border: "#334155",
      brightness: 1.0,
      contrast: 1.05,
      font: "system-ui"
    }
  },
  sites: {} // host -> { enabled: boolean, theme?: partial overrides }
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(null);
  if (!existing.global) await chrome.storage.sync.set(DEFAULTS);
});

// Keyboard shortcut: Alt+D toggles current site
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-dark-mode") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE" });
});
