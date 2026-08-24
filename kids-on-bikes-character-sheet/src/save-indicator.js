// Fixed bottom-left indicator showing save status, shared by sheet.js and gm.js.
let el = null;

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
  const node = ensureEl();
  setTheme(node, theme);
  node.textContent = "Saving...";
  node.classList.remove("saved", "error");
  node.classList.add("visible");
}

export function showSaved(theme) {
  const node = ensureEl();
  setTheme(node, theme);
  node.textContent = "Saved";
  // Stays dimly visible (rather than fading out) so the last save state is always in view.
  node.classList.remove("error");
  node.classList.add("visible", "saved");
}

export function showSaveError(theme, message = "Save failed") {
  const node = ensureEl();
  setTheme(node, theme);
  node.textContent = message;
  node.classList.remove("saved");
  node.classList.add("visible", "error");
}
