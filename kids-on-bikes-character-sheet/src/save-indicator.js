// Fixed bottom-left indicator showing save status, shared by sheet.js and gm.js.
let el = null;
let fadeTimeout = null;

function ensureEl() {
  if (el && document.body.contains(el)) return el;
  el = document.createElement("div");
  el.id = "kob-save-indicator";
  el.className = "save-indicator";
  document.body.appendChild(el);
  return el;
}

function setTheme(node, theme) {
  node.classList.toggle("dark", theme === "dark");
  node.classList.toggle("light", theme !== "dark");
}

export function showSaving(theme) {
  clearTimeout(fadeTimeout);
  const node = ensureEl();
  setTheme(node, theme);
  node.textContent = "Saving...";
  node.classList.remove("faded");
  node.classList.add("visible");
}

export function showSaved(theme) {
  clearTimeout(fadeTimeout);
  const node = ensureEl();
  setTheme(node, theme);
  node.textContent = "Saved";
  node.classList.remove("faded");
  node.classList.add("visible");
  fadeTimeout = setTimeout(() => {
    node.classList.add("faded");
  }, 1200);
}
