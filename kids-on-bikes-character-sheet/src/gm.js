import OBR from "@owlbear-rodeo/sdk";

const STATS = ["fight", "flight", "brains", "brawn", "charm", "grit"];
const DIES = ["d20", "d12", "d10", "d8", "d6", "d4"];
const POWERED_KEY = "kob-powered-sheet";

const TROPES = [
  { id: "custom",                   label: "Custom",                 ages: ["child","teen","adult"], stats: {} },
  { id: "blue-collar-worker",       label: "Blue-Collar Worker",     ages: ["adult"],                stats: { brains:"d6",  brawn:"d20", charm:"d8",  fight:"d12", flight:"d4",  grit:"d10" } },
  { id: "brilliant-mathlete",       label: "Brilliant Mathlete",     ages: ["child","teen"],         stats: { brains:"d20", brawn:"d4",  charm:"d8",  fight:"d6",  flight:"d12", grit:"d10" } },
  { id: "brutish-jock",             label: "Brutish Jock",           ages: ["teen"],                 stats: { brains:"d4",  brawn:"d20", charm:"d6",  fight:"d12", flight:"d8",  grit:"d10" } },
  { id: "bully",                    label: "Bully",                  ages: ["child","teen"],         stats: { brains:"d6",  brawn:"d12", charm:"d4",  fight:"d20", flight:"d10", grit:"d8"  } },
  { id: "conspiracy-theorist",      label: "Conspiracy Theorist",    ages: ["teen","adult"],         stats: { brains:"d20", brawn:"d4",  charm:"d6",  fight:"d12", flight:"d10", grit:"d8"  } },
  { id: "funny-sidekick",           label: "Funny Sidekick",         ages: ["child","teen"],         stats: { brains:"d8",  brawn:"d12", charm:"d20", fight:"d4",  flight:"d10", grit:"d6"  } },
  { id: "laid-back-slacker",        label: "Laid-Back Slacker",      ages: ["teen","adult"],         stats: { brains:"d10", brawn:"d6",  charm:"d12", fight:"d4",  flight:"d20", grit:"d8"  } },
  { id: "loner-weirdo",             label: "Loner Weirdo",           ages: ["child","teen"],         stats: { brains:"d8",  brawn:"d10", charm:"d4",  fight:"d12", flight:"d6",  grit:"d20" } },
  { id: "overprotective-parent",    label: "Overprotective Parent",  ages: ["adult"],                stats: { brains:"d12", brawn:"d10", charm:"d8",  fight:"d20", flight:"d6",  grit:"d4"  } },
  { id: "plastic-beauty",           label: "Plastic Beauty",         ages: ["teen"],                 stats: { brains:"d8",  brawn:"d6",  charm:"d20", fight:"d10", flight:"d12", grit:"d4"  } },
  { id: "popular-kid",              label: "Popular Kid",            ages: ["child","teen"],         stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d12", grit:"d8"  } },
  { id: "reclusive-eccentric",      label: "Reclusive Eccentric",    ages: ["adult"],                stats: { brains:"d12", brawn:"d8",  charm:"d4",  fight:"d6",  flight:"d20", grit:"d10" } },
  { id: "scout",                    label: "Scout",                  ages: ["child","teen"],         stats: { brains:"d20", brawn:"d8",  charm:"d10", fight:"d4",  flight:"d6",  grit:"d12" } },
  { id: "stoic-professional",       label: "Stoic Professional",     ages: ["adult"],                stats: { brains:"d12", brawn:"d8",  charm:"d10", fight:"d4",  flight:"d6",  grit:"d20" } },
  { id: "wannabe",                  label: "Wannabe",                ages: ["teen"],                 stats: { brains:"d12", brawn:"d6",  charm:"d10", fight:"d4",  flight:"d20", grit:"d8"  } },
  { id: "young-provider",           label: "Young Provider",         ages: ["teen"],                 stats: { brains:"d8",  brawn:"d12", charm:"d10", fight:"d6",  flight:"d4",  grit:"d20" } },
];

let appRoot = null;
let poweredState = emptyPoweredState();
let saveTimeout = null;
let editingPowerId = null;

export async function initGM(app) {
  appRoot = app;
  const metadata = await OBR.room.getMetadata();
  poweredState = getPoweredState(metadata);
  renderGMApp();

  OBR.room.onMetadataChange(metadataUpdate => {
    poweredState = getPoweredState(metadataUpdate);
    renderPartyPage();
    renderPoweredPage();
  });
}

function renderGMApp() {
  appRoot.innerHTML = `
    <div class="light">
      <div class="book-header">
        <span class="book-title">Kids on Bikes GM</span>
      </div>
      <div class="top-tabs">
        <div class="top-tab active" data-tab="party">Party</div>
        <div class="top-tab" data-tab="powered">Powered Character</div>
      </div>
      <div class="page active" data-page="party" id="page-party"></div>
      <div class="page" data-page="powered" id="page-powered"></div>
    </div>
  `;

  setupTabListeners();
  renderPartyPage();
  renderPoweredPage();
}

function setupTabListeners() {
  appRoot.querySelectorAll(".top-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      appRoot.querySelectorAll(".top-tab").forEach(node => node.classList.remove("active"));
      appRoot.querySelectorAll(".page").forEach(node => node.classList.remove("active"));
      tab.classList.add("active");
      appRoot.querySelector(`[data-page="${tab.dataset.tab}"]`).classList.add("active");
    });
  });
}

function renderPartyPage() {
  const page = document.getElementById("page-party");
  if (!page) return;

  page.innerHTML = `
    <div class="sh">Party</div>
    <div id="party-list">
      <div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">Loading…</div>
    </div>
  `;

  loadPartyPage();
}

async function loadPartyPage() {
  const list = document.getElementById("party-list");
  if (!list) return;

  const [players, metadata] = await Promise.all([
    OBR.party.getPlayers(),
    OBR.room.getMetadata(),
  ]);

  const sheets = players
    .map(player => ({ player, data: metadata[`kob-sheet-${player.id}`] }))
    .filter(({ data }) => data && data.name);

  if (!sheets.length) {
    list.innerHTML = `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">No character sheets found.</div>`;
    return;
  }

  list.innerHTML = sheets.map(({ player, data }) => `
    <div class="party-item">
      <div class="party-header" data-pid="${player.id}">
        <span>${esc(data.name || player.name)}</span>
        <span class="chevron">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2,3 5,7 8,3"/>
          </svg>
        </span>
      </div>
      <div class="party-details" id="pdetail-${player.id}">
        <div class="party-detail-row"><span>Trope</span><span>${esc(tropeLabel(data.trope, data.tropeName))}</span></div>
        <div class="party-detail-row"><span>Age</span><span>${cap(data.age || "—")}</span></div>
        ${STATS.map(stat => `
          <div class="party-detail-row">
            <span>${cap(stat)}</span>
            <span>${data.stats?.[stat] || "—"}</span>
          </div>
        `).join("")}
        <div class="party-detail-row"><span>Adversity</span><span>${data.tokens ?? 0}</span></div>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".party-header").forEach(header => {
    header.addEventListener("click", () => {
      const detail = document.getElementById(`pdetail-${header.dataset.pid}`);
      const chevron = header.querySelector(".chevron");
      detail.classList.toggle("open");
      chevron.classList.toggle("open");
    });
  });
}

function renderPoweredPage() {
  const page = document.getElementById("page-powered");
  if (!page) return;

  const editingPower = poweredState.powers.find(power => power.id === editingPowerId) || null;

  page.innerHTML = `
    <div class="f">
      <span class="fl">Name</span>
      <input class="fv" id="inp-powered-name" type="text" value="${esc(poweredState.name)}" placeholder="Enter name…" />
    </div>
    <div class="f">
      <span class="fl">Trope</span>
      ${tropeSelect(poweredState)}
    </div>
    ${poweredState.trope === "custom" ? `
      <div class="f">
        <span class="fl">Custom</span>
        <input class="fv" id="inp-powered-trope-name" type="text" value="${esc(poweredState.tropeName)}" placeholder="Name the trope…" />
      </div>
    ` : ""}
    <div class="f">
      <span class="fl">Age</span>
      ${ageSelect(poweredState)}
    </div>
    <div class="sh">Stats</div>
    <div class="sgrid">
      ${STATS.map(stat => `
        <div class="si">
          <span class="sn">${cap(stat)}</span>
          <select class="sdie" id="powered-stat-${stat}">
            <option value="">—</option>
            ${DIES.map(die => `<option value="${die}" ${poweredState.stats[stat] === die ? "selected" : ""}>${die}</option>`).join("")}
          </select>
        </div>
      `).join("")}
    </div>
    <div class="sh">Psychic Energy</div>
    <div class="f">
      <span class="fl">Current</span>
      <input class="fv" id="inp-powered-pe-current" type="number" min="0" value="${esc(String(poweredState.psychicEnergyCurrent))}" placeholder="0" />
    </div>
    <div class="f">
      <span class="fl">Max</span>
      <input class="fv" id="inp-powered-pe-max" type="number" min="0" value="${esc(String(poweredState.psychicEnergyMax))}" placeholder="0" />
    </div>
    <div class="sh">Inventory</div>
    <div id="powered-inventory-list">
      ${poweredState.inventory.map((item, index) => `
        <div class="inv-item">
          <span>${esc(item)}</span>
          <button class="str-remove" data-powered-inv-remove="${index}">×</button>
        </div>
      `).join("") || `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">No items listed.</div>`}
    </div>
    <div class="inv-add-row">
      <input class="inv-input" id="powered-inv-input" placeholder="Add item…" type="text" />
      <button class="str-add-btn" id="powered-inv-add-btn">Add</button>
    </div>
    <div class="sh">Powers</div>
    <div id="powered-powers-list">
      ${renderPowersList(poweredState.powers, true)}
    </div>
    <div class="power-form">
      <input class="power-input" id="inp-power-title" type="text" value="${esc(editingPower?.title || "")}" placeholder="Power title" />
      <textarea class="power-input power-textarea" id="inp-power-desc" placeholder="Power description">${esc(editingPower?.description || "")}</textarea>
      <div class="power-form-row">
        <input class="power-input" id="inp-power-cost" type="number" min="0" value="${esc(editingPower?.cost === "" || editingPower?.cost === null || editingPower?.cost === undefined ? "" : String(editingPower.cost))}" placeholder="Psychic Energy cost (optional)" />
        <div class="power-form-actions">
          <button class="str-add-btn" id="btn-power-add">${editingPower ? "Save Power" : "Add Power"}</button>
          ${editingPower ? `<button class="str-add-btn" id="btn-power-cancel" type="button">Cancel</button>` : ""}
        </div>
      </div>
    </div>
  `;

  setupPoweredListeners();
}

function setupPoweredListeners() {
  document.getElementById("inp-powered-name").addEventListener("input", event => {
    poweredState.name = event.target.value;
    schedulePoweredSave();
  });

  document.getElementById("sel-powered-trope").addEventListener("change", event => {
    poweredState.trope = event.target.value;
    const trope = TROPES.find(item => item.id === poweredState.trope);
    if (trope && trope.id !== "custom" && Object.keys(trope.stats).length) {
      poweredState.stats = { ...trope.stats };
      if (trope.ages.length === 1) poweredState.age = trope.ages[0];
    }
    renderPoweredPage();
    schedulePoweredSave();
  });

  const customTropeInput = document.getElementById("inp-powered-trope-name");
  if (customTropeInput) {
    customTropeInput.addEventListener("input", event => {
      poweredState.tropeName = event.target.value;
      schedulePoweredSave();
    });
  }

  document.getElementById("sel-powered-age").addEventListener("change", event => {
    const newAge = event.target.value;
    if (poweredState.trope && poweredState.trope !== "custom") {
      const trope = TROPES.find(item => item.id === poweredState.trope);
      if (trope && !trope.ages.includes(newAge)) {
        poweredState.trope = "";
      }
    }
    poweredState.age = newAge;
    renderPoweredPage();
    schedulePoweredSave();
  });

  STATS.forEach(stat => {
    document.getElementById(`powered-stat-${stat}`).addEventListener("change", event => {
      poweredState.stats[stat] = event.target.value;
      schedulePoweredSave();
    });
  });

  document.getElementById("inp-powered-pe-current").addEventListener("input", event => {
    poweredState.psychicEnergyCurrent = normalizeNumberInput(event.target.value);
    schedulePoweredSave();
  });

  document.getElementById("inp-powered-pe-max").addEventListener("input", event => {
    poweredState.psychicEnergyMax = normalizeNumberInput(event.target.value);
    schedulePoweredSave();
  });

  document.getElementById("powered-inv-add-btn").addEventListener("click", () => {
    const input = document.getElementById("powered-inv-input");
    const value = input.value.trim();
    if (!value) return;
    poweredState.inventory.push(value);
    renderPoweredPage();
    schedulePoweredSave();
  });

  document.getElementById("powered-inv-input").addEventListener("keydown", event => {
    if (event.key === "Enter") document.getElementById("powered-inv-add-btn").click();
  });

  document.querySelectorAll("[data-powered-inv-remove]").forEach(button => {
    button.addEventListener("click", () => {
      poweredState.inventory.splice(parseInt(button.dataset.poweredInvRemove, 10), 1);
      renderPoweredPage();
      schedulePoweredSave();
    });
  });

  document.getElementById("btn-power-add").addEventListener("click", () => {
    const titleInput = document.getElementById("inp-power-title");
    const descriptionInput = document.getElementById("inp-power-desc");
    const costInput = document.getElementById("inp-power-cost");
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const cost = normalizeNumberInput(costInput.value);

    if (!title || !description) return;

    if (editingPowerId) {
      poweredState.powers = poweredState.powers.map(power => (
        power.id === editingPowerId
          ? { ...power, title, description, cost }
          : power
      ));
      editingPowerId = null;
    } else {
      poweredState.powers.push({
        id: createId(),
        title,
        description,
        cost,
      });
    }

    renderPoweredPage();
    schedulePoweredSave();
  });

  document.getElementById("btn-power-cancel")?.addEventListener("click", () => {
    editingPowerId = null;
    renderPoweredPage();
  });

  document.querySelectorAll("[data-powered-power-edit]").forEach(button => {
    button.addEventListener("click", () => {
      editingPowerId = button.dataset.poweredPowerEdit;
      renderPoweredPage();
    });
  });

  document.querySelectorAll("[data-powered-power-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const powerId = button.dataset.poweredPowerRemove;
      poweredState.powers = poweredState.powers.filter(power => power.id !== powerId);
      if (editingPowerId === powerId) editingPowerId = null;
      renderPoweredPage();
      schedulePoweredSave();
    });
  });

  setupPowerExpandListeners();
}

function schedulePoweredSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePowered, 300);
}

async function savePowered() {
  await OBR.room.setMetadata({ [POWERED_KEY]: poweredState });
}

function renderPowersList(powers, editable = false) {
  if (!powers.length) {
    return `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">No powers listed.</div>`;
  }

  return powers.map(power => `
    <div class="power-item">
      <div class="power-header">
        <span>${esc(power.title) || "Untitled Power"}</span>
        <div class="power-header-actions">
          ${power.cost !== "" && power.cost !== null && power.cost !== undefined
            ? `<span class="power-cost">${esc(String(power.cost))} PE</span>`
            : ""}
          ${editable ? `<button class="str-add-btn" data-powered-power-edit="${power.id}" type="button">Edit</button>` : ""}
          ${editable ? `<button class="str-remove" data-powered-power-remove="${power.id}">×</button>` : ""}
          <button class="icon-btn power-expand" data-power-expand="${power.id}">
            <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="2,3 5,7 8,3"/>
            </svg>
            <span class="tooltip">Details</span>
          </button>
        </div>
      </div>
      <div class="power-desc" id="power-${power.id}">${esc(power.description)}</div>
    </div>
  `).join("");
}

function setupPowerExpandListeners() {
  document.querySelectorAll(".power-expand").forEach(button => {
    button.addEventListener("click", () => {
      const detail = document.getElementById(`power-${button.dataset.powerExpand}`);
      const chevron = button.querySelector(".chevron");
      if (!detail || !chevron) return;
      detail.classList.toggle("open");
      chevron.classList.toggle("open");
    });
  });
}

function tropeSelect(currentState) {
  const validTropes = TROPES.filter(trope => !currentState.age || trope.ages.includes(currentState.age));
  const invalidTropes = TROPES.filter(trope => currentState.age && !trope.ages.includes(currentState.age));
  return `
    <select class="fsel" id="sel-powered-trope">
      <option value="">— select —</option>
      ${validTropes.map(trope => `<option value="${trope.id}" ${currentState.trope === trope.id ? "selected" : ""}>${esc(tropeOptionLabel(trope, currentState.tropeName))}</option>`).join("")}
      ${invalidTropes.length ? `<optgroup label="Not available for this age">
        ${invalidTropes.map(trope => `<option value="${trope.id}" disabled>${esc(trope.label)}</option>`).join("")}
      </optgroup>` : ""}
    </select>
  `;
}

function ageSelect(currentState) {
  const ages = [
    { value: "child", label: "Child" },
    { value: "teen", label: "Teen" },
    { value: "adult", label: "Adult" },
  ];
  const currentTrope = TROPES.find(trope => trope.id === currentState.trope);
  return `
    <select class="fsel" id="sel-powered-age">
      <option value="">— select —</option>
      ${ages.map(age => {
        const disabled = currentTrope && !currentTrope.ages.includes(age.value);
        return `<option value="${age.value}" ${currentState.age === age.value ? "selected" : ""} ${disabled ? "disabled" : ""}>${age.label}${disabled ? " (n/a)" : ""}</option>`;
      }).join("")}
    </select>
  `;
}

function emptyPoweredState() {
  return {
    name: "",
    trope: "",
    tropeName: "",
    age: "",
    stats: { fight: "", flight: "", brains: "", brawn: "", charm: "", grit: "" },
    psychicEnergyCurrent: "",
    psychicEnergyMax: "",
    inventory: [],
    powers: [],
  };
}

function getPoweredState(metadata) {
  const base = emptyPoweredState();
  const saved = metadata[POWERED_KEY] || {};
  return {
    ...base,
    ...saved,
    stats: { ...base.stats, ...(saved.stats || {}) },
  };
}

function normalizeNumberInput(value) {
  return value === "" ? "" : String(Math.max(0, Number(value)));
}

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function cap(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tropeOptionLabel(trope, customName = "") {
  if (trope.id === "custom" && customName.trim()) {
    return `Custom: ${customName.trim()}`;
  }
  return trope.label;
}

function tropeLabel(id, customName = "") {
  const trope = TROPES.find(item => item.id === id);
  if (!trope) return "—";
  if (trope.id === "custom" && customName.trim()) return customName.trim();
  return trope.label;
}