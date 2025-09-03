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
  }
};

async function load() {
  const store = await chrome.storage.sync.get(null);
  const global = store.global || DEFAULTS.global;

  // Global toggles & schedule
  document.getElementById("globalEnabled").checked = !!global.enabledByDefault;
  document.getElementById("schedEnabled").checked = !!global.schedule?.enabled;
  document.getElementById("start").value = global.schedule?.start || "19:00";
  document.getElementById("end").value = global.schedule?.end || "07:00";

  // Theme
  const t = global.theme || DEFAULTS.global.theme;
  setVal("g_bg", t.bg);
  setVal("g_text", t.text);
  setVal("g_link", t.link);
  setVal("g_accent", t.accent);
  setVal("g_brightness", t.brightness ?? 1);
  setVal("g_contrast", t.contrast ?? 1.05);
  setVal("g_font", t.font || "system-ui");

  // Site list
  renderSiteList(store.sites || {});
}

function setVal(id, v) { document.getElementById(id).value = v; }

function readGlobal() {
  return {
    enabledByDefault: document.getElementById("globalEnabled").checked,
    schedule: {
      enabled: document.getElementById("schedEnabled").checked,
      start: document.getElementById("start").value || "19:00",
      end: document.getElementById("end").value || "07:00"
    },
    theme: {
      bg: document.getElementById("g_bg").value,
      text: document.getElementById("g_text").value,
      link: document.getElementById("g_link").value,
      accent: document.getElementById("g_accent").value,
      brightness: parseFloat(document.getElementById("g_brightness").value),
      contrast: parseFloat(document.getElementById("g_contrast").value),
      font: document.getElementById("g_font").value,
      surface: "#1e293b",
      border: "#334155"
    }
  };
}

function renderSiteList(sites) {
  const container = document.getElementById("siteList");
  const keys = Object.keys(sites);
  if (!keys.length) {
    container.innerHTML = `<div class="text-slate-400">No per-site overrides yet.</div>`;
    return;
  }
  container.innerHTML = keys.map(host => {
    const s = sites[host];
    return `
      <div class="flex items-center justify-between py-2 border-b border-slate-700">
        <div>
          <div class="font-semibold">${host}</div>
          <div class="text-slate-400">Enabled: ${!!s.enabled}</div>
        </div>
        <button data-host="${host}" class="removeSite text-red-300 underline">Remove</button>
      </div>`;
  }).join("");

  container.querySelectorAll(".removeSite").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const host = e.target.getAttribute("data-host");
      const all = await chrome.storage.sync.get(null);
      if (all.sites?.[host]) {
        delete all.sites[host];
        await chrome.storage.sync.set({ sites: all.sites });
        renderSiteList(all.sites || {});
      }
    });
  });
}

document.getElementById("saveGlobal").addEventListener("click", async () => {
  const global = readGlobal();
  await chrome.storage.sync.set({ global });
  // Optionally refresh all tabs (heavy), skip and let per-page logic handle next load
  alert("Global settings saved.");
});

document.getElementById("resetGlobal").addEventListener("click", async () => {
  await chrome.storage.sync.set({ global: DEFAULTS.global });
  await load();
  alert("Global settings reset.");
});

document.getElementById("clearSites").addEventListener("click", async () => {
  await chrome.storage.sync.set({ sites: {} });
  await load();
});

document.addEventListener("DOMContentLoaded", load);
