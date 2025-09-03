function getHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Check if URL is a Chrome internal page
function isChromeInternalURL(url) {
  return url?.startsWith('chrome://') || url?.startsWith('chrome-extension://') || url?.startsWith('about:');
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function load() {
  const tab = await getActiveTab();
  const host = getHost(tab?.url || "");
  document.getElementById("host").textContent = host ? `Site: ${host}` : "Site: (unknown)";

  const store = await chrome.storage.sync.get(null);
  const global = store.global || {};
  const site = (store.sites && host) ? store.sites[host] : null;

  const theme = { ...(global.theme || {}), ...(site?.theme || {}) };

  // Populate UI
  document.getElementById("enableSite").checked = !!site?.enabled;
  document.getElementById("bg").value = toHex(theme.bg || "#121212");
  document.getElementById("text").value = toHex(theme.text || "#e5e7eb");
  document.getElementById("link").value = toHex(theme.link || "#93c5fd");
  document.getElementById("accent").value = toHex(theme.accent || "#ef4444");
  document.getElementById("brightness").value = theme.brightness ?? 1.0;
  document.getElementById("contrast").value = theme.contrast ?? 1.05;
  document.getElementById("font").value = theme.font || "system-ui";

  // Disable controls for Chrome internal pages
  const isChromePage = isChromeInternalURL(tab?.url);
  if (isChromePage) {
    document.getElementById("toggleBtn").disabled = true;
    document.getElementById("save").disabled = true;
    document.getElementById("reset").disabled = true;
    document.getElementById("host").textContent = "Site: Chrome internal page";
  }

  document.getElementById("toggleBtn").addEventListener("click", async () => {
    if (!tab?.id || isChromeInternalURL(tab.url)) return;
    const res = await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE" });
    document.getElementById("enableSite").checked = res?.enabled ?? false;
  });

  document.getElementById("save").addEventListener("click", async () => {
    if (isChromeInternalURL(tab?.url)) return;
    
    const enabled = document.getElementById("enableSite").checked;
    const themeUpdate = readThemeFromUI();

    const all = await chrome.storage.sync.get(null);
    all.sites = all.sites || {};
    if (!host) return;
    all.sites[host] = { ...(all.sites[host] || {}), enabled, theme: themeUpdate };
    await chrome.storage.sync.set({ sites: all.sites });

    if (tab?.id && !isChromeInternalURL(tab.url)) {
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          type: "APPLY_THEME", 
          theme: { ...(global.theme || {}), ...themeUpdate } 
        });
      } catch (error) {
        // If content script isn't ready/injected, inject it first
        if (error.message.includes("Receiving end does not exist") || 
            error.message.includes("Could not establish connection")) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });
          
          // Retry sending the message after injection
          await chrome.tabs.sendMessage(tab.id, { 
            type: "APPLY_THEME", 
            theme: { ...(global.theme || {}), ...themeUpdate } 
          });
        } else {
          console.error("Error sending message:", error);
        }
      }
    }
    window.close();
  });

  document.getElementById("reset").addEventListener("click", async () => {
    if (isChromeInternalURL(tab?.url)) return;
    
    const all = await chrome.storage.sync.get(null);
    if (host && all.sites?.[host]) {
      delete all.sites[host];
      await chrome.storage.sync.set({ sites: all.sites });
    }
    if (tab?.id && !isChromeInternalURL(tab.url)) await chrome.tabs.reload(tab.id);
    window.close();
  });
}

function readThemeFromUI() {
  return {
    bg: document.getElementById("bg").value,
    text: document.getElementById("text").value,
    link: document.getElementById("link").value,
    accent: document.getElementById("accent").value,
    brightness: parseFloat(document.getElementById("brightness").value),
    contrast: parseFloat(document.getElementById("contrast").value),
    font: document.getElementById("font").value
  };
}

function toHex(v) {
  if (!v) return "#000000";
  if (v.startsWith("#")) return v;
  // Naive rgb()/hsl() → fallback default
  return "#000000";
}

document.addEventListener("DOMContentLoaded", load);