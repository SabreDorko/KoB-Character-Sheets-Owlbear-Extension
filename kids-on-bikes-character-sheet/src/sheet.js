import OBR from "@owlbear-rodeo/sdk";

const STATS = ["brains", "brawn", "charm", "fight", "flight", "grit"];

const AGE_BONUSES = {
  kid:   ["brains", "flight"],
  teen:  ["brawn", "fight"],
  adult: ["charm", "grit"],
};

export function initSheet(app) {
  app.innerHTML = `
    <div class="card">
      <p class="section-label">Character</p>
      <div class="field-row">
        <span class="field-label">Name</span>
        <input type="text" id="char-name" placeholder="Enter name..." />
      </div>
      <div class="field-row">
        <span class="field-label">Age</span>
        <select id="char-age">
          <option value="">— Select —</option>
          <option value="kid">Kid (+1 Brains, Flight)</option>
          <option value="teen">Teen (+1 Brawn, Fight)</option>
          <option value="adult">Adult (+1 Charm, Grit)</option>
        </select>
      </div>
    </div>

    <div class="card">
      <p class="section-label">Stats</p>
      ${STATS.map(s => `
        <div class="stat-row">
          <span class="stat-name" id="label-${s}">${capitalize(s)}</span>
          <select id="stat-${s}">
            <option value="">— assign die —</option>
            <option value="d20">d20</option>
            <option value="d12">d12</option>
            <option value="d10">d10</option>
            <option value="d8">d8</option>
            <option value="d6">d6</option>
            <option value="d4">d4</option>
          </select>
        </div>
      `).join("")}
    </div>

    <div class="card">
      <p class="section-label">Adversity Tokens</p>
      <div class="counter-row">
        <button class="counter-btn" id="token-minus">−</button>
        <span class="counter-val" id="token-count">0</span>
        <button class="counter-btn" id="token-plus">+</button>
      </div>
    </div>

    <div class="card">
      <p class="section-label">Strengths</p>
      <div id="strengths-list"></div>
      <div class="add-row">
        <input type="text" id="strength-input" placeholder="Add a strength..." />
        <button class="add-btn" id="strength-add">Add</button>
      </div>
    </div>
  `;

  setupListeners();
  load();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function applyBonusLabels(age) {
  const bonused = AGE_BONUSES[age] || [];
  STATS.forEach(stat => {
    const label = document.getElementById(`label-${stat}`);
    const existing = label.querySelector(".bonus-tag");
    if (existing) existing.remove();
    if (bonused.includes(stat)) {
      const tag = document.createElement("span");
      tag.className = "bonus-tag";
      tag.textContent = "+1";
      label.appendChild(tag);
    }
  });
}

function addStrengthItem(text) {
  const list = document.getElementById("strengths-list");
  const item = document.createElement("div");
  item.className = "strength-item";
  item.dataset.value = text;
  item.innerHTML = `<span>${text}</span><button class="remove-btn">×</button>`;
  item.querySelector(".remove-btn").addEventListener("click", () => {
    item.remove();
    save();
  });
  list.appendChild(item);
}

function renderStrengths(strengths) {
  const list = document.getElementById("strengths-list");
  list.innerHTML = "";
  strengths.forEach(s => addStrengthItem(s));
}

function getFormData() {
  return {
    name:      document.getElementById("char-name").value,
    age:       document.getElementById("char-age").value,
    stats:     Object.fromEntries(STATS.map(s => [s, document.getElementById(`stat-${s}`).value])),
    tokens:    parseInt(document.getElementById("token-count").textContent) || 0,
    strengths: Array.from(document.querySelectorAll(".strength-item")).map(el => el.dataset.value),
  };
}

async function save() {
  const playerId = await OBR.player.getId();
  const data = getFormData();
  await OBR.room.setMetadata({ [`kob-sheet-${playerId}`]: data });
}

async function load() {
  const playerId = await OBR.player.getId();
  const metadata = await OBR.room.getMetadata();
  const data = metadata[`kob-sheet-${playerId}`];
  if (!data) return;

  document.getElementById("char-name").value = data.name || "";
  document.getElementById("char-age").value  = data.age  || "";
  applyBonusLabels(data.age);

  STATS.forEach(s => {
    document.getElementById(`stat-${s}`).value = data.stats?.[s] || "";
  });

  document.getElementById("token-count").textContent = data.tokens ?? 0;
  renderStrengths(data.strengths || []);
}

function setupListeners() {
  document.getElementById("char-name").addEventListener("input", save);

  document.getElementById("char-age").addEventListener("change", () => {
    applyBonusLabels(document.getElementById("char-age").value);
    save();
  });

  STATS.forEach(s => {
    document.getElementById(`stat-${s}`).addEventListener("change", save);
  });

  document.getElementById("token-plus").addEventListener("click", () => {
    const el = document.getElementById("token-count");
    el.textContent = parseInt(el.textContent) + 1;
    save();
  });

  document.getElementById("token-minus").addEventListener("click", () => {
    const el = document.getElementById("token-count");
    const current = parseInt(el.textContent);
    if (current > 0) el.textContent = current - 1;
    save();
  });

  document.getElementById("strength-add").addEventListener("click", () => {
    const input = document.getElementById("strength-input");
    const text = input.value.trim();
    if (!text) return;
    addStrengthItem(text);
    input.value = "";
    save();
  });

  document.getElementById("strength-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("strength-add").click();
  });
}