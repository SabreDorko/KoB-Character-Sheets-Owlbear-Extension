import OBR from "@owlbear-rodeo/sdk";

const STATS = ["fight", "flight", "brains", "brawn", "charm", "grit"];
const DIES = ["d20", "d12", "d10", "d8", "d6", "d4"];
const POWERED_KEY = "kob-powered-sheet";

const AGE_BONUSES = {
  child: ["charm", "flight"],
  teen:  ["brawn",  "fight"],
  adult: ["brains",  "grit"],
};

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

const STRENGTHS = [
  { id: "cool-under-pressure",  label: "Cool Under Pressure", desc: "May spend 1 Adversity Token to take half of your die’s value instead of rolling on a Snap Decision.", ageGrant: [] },
  { id: "easygoing",            label: "Easygoing",           desc: "Gain 2 Adversity Tokens when you fail, instead of 1.",  ageGrant: [] },
  { id: "gross",                label: "Gross",               desc: "You have some kind of gross bodily trick (loud, quiet, smelly... up to you) that you can do on command.",ageGrant: [] },
  { id: "heroic",               label: "Heroic",              desc: "You do not need the GM’s permission to spend Adversity Tokens to ignore fears.",      ageGrant: [] },
  { id: "intuitive",            label: "Intuitive",           desc: "May spend 1 Adversity Token to ask the GM about your surroundings, an NPC, or the like. The GM must answer honestly.", ageGrant: [] },
  { id: "loyal",                label: "Loyal",               desc: "Each of the Adversity Tokens you spend to help your friends gives them a +2 instead of a +1.",     ageGrant: [] },
  { id: "lucky",                label: "Lucky",               desc: "May spend 2 Adversity Tokens to reroll a stat check.", ageGrant: [] },
  { id: "prepared",             label: "Prepared",            desc: "May spend 2 Adversity Tokens to just happen to have one commonplace item with you (GM’s discretion).", ageGrant: [] },
  { id: "protective",           label: "Protective",          desc: "Add +3 to rolls when defending one of your friends.",      ageGrant: [] },
  { id: "quick-healing",        label: "Quick Healing",       desc: "You recover from injuries more quickly, and don’t suffer lasting effects from most injuries.",      ageGrant: ["child"] },
  { id: "rebellious",           label: "Rebellious",          desc: "Add +3 to rolls when persuading or resisting persuasion from children. Add +3 to rolls when resisting persuasion from adults.",      ageGrant: ["teen"] },
  { id: "skilled-at-___",       label: "Skilled at ___",      desc: "Choose a skill (GM’s discretion). You are assumed to succeed when making even moderately difficult checks (9 or less) involving this skill. If the GM determines that you do need to roll for a more difficult check, add up to +3 to your roll.",      ageGrant: ["adult"] },
  { id: "tough",                label: "Tough",               desc: "If you lose a combat roll, add +3 to the negative number. You still lose the roll no matter what, but could reduce your loss to -1.",      ageGrant: [] },
  { id: "treasure-hunter",      label: "Treasure Hunter",     desc: "May spend 1 Adversity Token to find a useful item in your surroundings.",      ageGrant: [] },
  { id: "unassuming",           label: "Unassuming",          desc: "May spend 2 Adversity Tokens to not be seen, within reason (GM’s discretion).",      ageGrant: [] },
  { id: "wealthy",              label: "Wealthy",             desc: "May spend money as though you were in a higher age bracket. For example, a wealthy child is considered to have the disposable income of a typical teen, and a wealthy teen is considered to have the disposable income of a typical adult. A wealthy adult is considered to not have to worry too much about money — they would certainly be able to buy anything they need, and likely able to spend their way out of a lot of situations.",      ageGrant: [] },
];

const AGE_GRANTED = {
  child:   ["quick-healing"],
  teen:  ["rebellious"],
  adult: ["skilled-at-___"],
};

let state = {
  theme: "light",
  name: "",
  age: "",
  trope: "",
  tropeName: "",
  stats: { fight:"", flight:"", brains:"", brawn:"", charm:"", grit:"" },
  tokens: 0,
  strengths: [],
  inventory: [],
  editingStrengths: false,
};

let strengthEditor = emptyStrengthEditor();

let metadataListenerBound = false;

let saveTimeout = null;
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 600);
}

async function save() {
  const playerId = await OBR.player.getId();
  await OBR.room.setMetadata({ [`kob-sheet-${playerId}`]: state });
}

async function load() {
  const playerId = await OBR.player.getId();
  const metadata = await OBR.room.getMetadata();
  const saved = metadata[`kob-sheet-${playerId}`];
  if (saved) state = { ...state, ...saved };
}

export async function initSheet(app) {
  await load();
  renderApp(app);

  if (!metadataListenerBound) {
    metadataListenerBound = true;
    OBR.room.onMetadataChange(() => {
      renderPartyPage();
      renderPoweredPage();
    });
  }
}

function renderApp(app) {
  app.innerHTML = `
    <div class="${state.theme}">
      <div class="book-header">
        <span class="book-title">Kids on Bikes</span>
        <div class="tog-row">
          <span class="tog-label">${state.theme === "light" ? "Light" : "Dark"}</span>
          <div class="tog" id="theme-tog">
            <div class="tog-thumb"></div>
          </div>
        </div>
      </div>
      <div class="top-tabs">
        <div class="top-tab active" data-tab="character">Character</div>
        <div class="top-tab" data-tab="inventory">Inventory</div>
        <div class="top-tab" data-tab="party">Party</div>
        <div class="top-tab" data-tab="powered">Powered</div>
      </div>
      <div class="page active" data-page="character" id="page-character"></div>
      <div class="page" data-page="inventory" id="page-inventory"></div>
      <div class="page" data-page="party" id="page-party"></div>
      <div class="page" data-page="powered" id="page-powered"></div>
    </div>
  `;

  renderCharacterPage();
  renderInventoryPage();
  renderPartyPage();
  renderPoweredPage();
  setupTabListeners(app);
  setupThemeToggle(app);
}

function setupTabListeners(app) {
  app.querySelectorAll(".top-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      app.querySelectorAll(".top-tab").forEach(t => t.classList.remove("active"));
      app.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      app.querySelector(`[data-page="${tab.dataset.tab}"]`).classList.add("active");
    });
  });
}

function setupThemeToggle(app) {
  app.querySelector("#theme-tog").addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    scheduleSave();
    renderApp(app);
  });
}

// ─── CHARACTER PAGE ───────────────────────────────────────────────

function renderCharacterPage() {
  const page = document.getElementById("page-character");
  const bonused = AGE_BONUSES[state.age] || [];
  const grantedIds = AGE_GRANTED[state.age] || [];

  page.innerHTML = `
    <div class="f">
      <span class="fl">Name</span>
      <input class="fv" id="inp-name" type="text" value="${esc(state.name)}" placeholder="Enter name…" />
    </div>
    <div class="f">
      <span class="fl">Trope</span>
      ${tropeSelect()}
    </div>
    ${state.trope === "custom" ? `
    <div class="f">
      <span class="fl">Custom</span>
      <input class="fv" id="inp-trope-name" type="text" value="${esc(state.tropeName)}" placeholder="Name your trope…" />
    </div>` : ""}
    <div class="f">
      <span class="fl">Age</span>
      ${ageSelect()}
    </div>
    <div class="sh">Stats</div>
    <div class="sgrid">
      ${STATS.map(s => {
        const usedDice = Object.entries(state.stats)
          .filter(([stat, die]) => die && stat !== s)
          .map(([_, die]) => die);
        const availableDice = DIES.filter(d => !usedDice.includes(d));
        return `
        <div class="si">
          <span class="sn">${cap(s)}${bonused.includes(s) ? `<span class="sb">+1</span>` : ""}</span>
          <select class="sdie" id="stat-${s}">
            <option value="">—</option>
            ${availableDice.map(d => `<option value="${d}" ${state.stats[s] === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
        </div>
      `}).join("")}
    </div>
    <div class="sh">Adversity Tokens</div>
    <div class="ctr">
      <div class="cb" id="tok-minus">−</div>
      <span class="cv" id="tok-val">${state.tokens}</span>
      <div class="cb" id="tok-plus">+</div>
    </div>
    <div class="sh">Strengths
      <button class="icon-btn" id="str-edit-btn" title="Edit Strengths">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/><line x1="6.5" y1="3.5" x2="8.5" y2="5.5"/>
        </svg>
        <span class="tooltip">Edit Strengths</span>
      </button>
    </div>
    <div id="strengths-list">
      ${renderStrengthsList(grantedIds)}
    </div>
    <div class="str-add-row ${state.editingStrengths ? "visible" : ""}" id="str-add-row">
      <select class="str-add-sel" id="str-add-sel">
        <option value="">— add strength —</option>
        ${STRENGTHS
          .filter(s => {
            const isGranted = grantedIds.includes(s.id);
            const isAdded = state.strengths.some(str => getStrengthId(str) === s.id);
            // Allow skilled-at-___ multiple times, but filter out other already-added strengths
            return !isGranted && (!isAdded || s.id === "skilled-at-___");
          })
          .map(s => `<option value="${s.id}" ${strengthEditor.type === s.id ? "selected" : ""}>${s.label}</option>`)
          .join("")}
        <option value="custom" ${strengthEditor.type === "custom" ? "selected" : ""}>Custom</option>
      </select>
      <button class="str-add-btn" id="str-add-btn" type="button">${strengthEditor.index === null ? "Add" : "Save"}</button>
      ${strengthEditor.type ? `<button class="str-add-btn" id="str-cancel-btn" type="button">Cancel</button>` : ""}
    </div>
    ${state.editingStrengths ? renderStrengthEditor() : ""}
  `;

  setupCharacterListeners();
}

function tropeSelect() {
  const validTropes = TROPES.filter(t =>
    !state.age || t.ages.includes(state.age)
  );
  const invalidTropes = TROPES.filter(t =>
    state.age && !t.ages.includes(state.age)
  );
  return `
    <select class="fsel" id="sel-trope">
      <option value="">— select —</option>
      ${validTropes.map(t => `<option value="${t.id}" ${state.trope === t.id ? "selected" : ""}>${esc(tropeOptionLabel(t))}</option>`).join("")}
      ${invalidTropes.length ? `<optgroup label="Not available for this age">
        ${invalidTropes.map(t => `<option value="${t.id}" disabled>${esc(t.label)}</option>`).join("")}
      </optgroup>` : ""}
    </select>
  `;
}

function ageSelect() {
  const ages = [
    { value: "child", label: "Child"   },
    { value: "teen",  label: "Teen"  },
    { value: "adult", label: "Adult" },
  ];
  const currentTrope = TROPES.find(t => t.id === state.trope);
  return `
    <select class="fsel" id="sel-age">
      <option value="">— select —</option>
      ${ages.map(a => {
        const disabled = currentTrope && !currentTrope.ages.includes(a.value);
        return `<option value="${a.value}" ${state.age === a.value ? "selected" : ""} ${disabled ? "disabled" : ""}>${a.label}${disabled ? " (n/a)" : ""}</option>`;
      }).join("")}
    </select>
  `;
}

function emptyStrengthEditor() {
  return {
    type: "",
    index: null,
    value: "",
    title: "",
    description: "",
  };
}

function getStrengthId(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (entry.type === "custom") return "custom";
  return entry.id || "";
}

function resolveStrengthEntry(entry, index, granted = false) {
  if (typeof entry === "string") {
    const strength = STRENGTHS.find(item => item.id === entry);
    if (!strength) return null;
    return {
      key: granted ? `granted-${entry}` : `owned-${index}`,
      index,
      granted,
      editable: false,
      label: strength.label,
      desc: strength.desc,
    };
  }

  if (entry?.type === "custom") {
    return {
      key: `owned-${index}`,
      index,
      granted,
      editable: !granted,
      label: entry.title || "Custom Strength",
      desc: entry.description || "",
      isCustom: true,
    };
  }

  const strength = STRENGTHS.find(item => item.id === entry?.id);
  if (!strength) return null;

  return {
    key: granted ? `granted-${entry.id}` : `owned-${index}`,
    index,
    granted,
    editable: false,
    label: entry.id === "skilled-at-___" && entry.value ? `Skilled at ${entry.value}` : strength.label,
    desc: strength.desc,
  };
}

function renderStrengthEditor() {
  if (!strengthEditor.type) return "";

  if (strengthEditor.type === "skilled-at-___") {
    return `
      <div class="str-editor">
        <input class="power-input" id="str-add-skill" type="text" value="${esc(strengthEditor.value)}" placeholder="Skill name" />
      </div>
    `;
  }

  if (strengthEditor.type === "custom") {
    return `
      <div class="str-editor">
        <input class="power-input" id="str-custom-title" type="text" value="${esc(strengthEditor.title)}" placeholder="Custom strength title" />
        <textarea class="power-input power-textarea str-custom-desc" id="str-custom-desc" placeholder="Custom strength description">${esc(strengthEditor.description)}</textarea>
      </div>
    `;
  }

  return "";
}

function renderStrengthsList(grantedIds) {
  const allActive = [
    ...grantedIds.map(id => resolveStrengthEntry(id, -1, true)).filter(Boolean),
    ...state.strengths
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => {
        const id = getStrengthId(entry);
        return id === "custom" || !grantedIds.includes(id);
      })
      .map(({ entry, index }) => resolveStrengthEntry(entry, index, false))
      .filter(Boolean),
  ];
  if (!allActive.length) return "";
  return allActive.map(({ key, index, granted, editable, label, desc, isCustom }) => {
    return `
      <div class="str" data-sid="${key}">
        <div class="str-left">
          <span class="str-name">${esc(label)}</span>
          ${granted ? `<span class="str-age">age</span>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:2px;">
          ${state.editingStrengths && editable
            ? `<button class="str-add-btn" data-edit-custom="${index}" type="button">Edit</button>`
            : ""}
          ${state.editingStrengths && !granted
            ? `<button class="str-remove" data-remove-index="${index}">×</button>`
            : ""}
          <button class="icon-btn str-expand" data-expand="${key}">
            <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6,2 2,5 6,8"/>
            </svg>
            <span class="tooltip">Details</span>
          </button>
        </div>
      </div>
      <div class="str-detail" id="detail-${key}">${esc(desc)}${isCustom && !desc ? "No description." : ""}</div>
    `;
  }).join("");
}

function setupCharacterListeners() {
  document.getElementById("inp-name").addEventListener("input", e => {
    state.name = e.target.value;
    scheduleSave();
  });

  document.getElementById("sel-trope").addEventListener("change", e => {
    state.trope = e.target.value;
    const trope = TROPES.find(t => t.id === state.trope);
    if (trope && trope.id !== "custom" && Object.keys(trope.stats).length) {
      state.stats = { ...trope.stats };
      if (trope.ages.length === 1) state.age = trope.ages[0];
    }
    scheduleSave();
    renderCharacterPage();
  });

  const customTropeInput = document.getElementById("inp-trope-name");
  if (customTropeInput) {
    customTropeInput.addEventListener("input", e => {
      state.tropeName = e.target.value;
      scheduleSave();
    });
  }

  document.getElementById("sel-age").addEventListener("change", e => {
    const newAge = e.target.value;
    if (state.trope && state.trope !== "custom") {
      const trope = TROPES.find(t => t.id === state.trope);
      if (trope && !trope.ages.includes(newAge)) {
        state.trope = "";
      }
    }
    state.age = newAge;
    const grantedForNewAge = AGE_GRANTED[newAge] || [];
    // Filter out strengths that were granted by a different age
    state.strengths = state.strengths.filter(s => {
      const strId = typeof s === "string" ? s : s.id;
      // Keep if it's not age-granted, or if it's granted by the new age
      return !Object.values(AGE_GRANTED).flat().includes(strId) || grantedForNewAge.includes(strId);
    });
    scheduleSave();
    renderCharacterPage();
  });

  STATS.forEach(s => {
    document.getElementById(`stat-${s}`).addEventListener("change", e => {
      state.stats[s] = e.target.value;
      scheduleSave();
    });
  });

  document.getElementById("tok-plus").addEventListener("click", () => {
    state.tokens++;
    document.getElementById("tok-val").textContent = state.tokens;
    scheduleSave();
  });

  document.getElementById("tok-minus").addEventListener("click", () => {
    if (state.tokens > 0) state.tokens--;
    document.getElementById("tok-val").textContent = state.tokens;
    scheduleSave();
  });

  document.getElementById("str-edit-btn").addEventListener("click", () => {
    state.editingStrengths = !state.editingStrengths;
    if (!state.editingStrengths) strengthEditor = emptyStrengthEditor();
    renderCharacterPage();
  });

  document.getElementById("str-add-sel").addEventListener("change", e => {
    strengthEditor = {
      type: e.target.value,
      index: null,
      value: "",
      title: "",
      description: "",
    };
    renderCharacterPage();
  });

  document.getElementById("str-add-btn").addEventListener("click", () => {
    const sel = document.getElementById("str-add-sel");
    if (!sel.value) return;

    let nextStrength;
    if (sel.value === "skilled-at-___") {
      const skillValue = document.getElementById("str-add-skill")?.value.trim() || "";
      if (!skillValue) return;
      nextStrength = { id: "skilled-at-___", value: skillValue };
    } else if (sel.value === "custom") {
      const title = document.getElementById("str-custom-title")?.value.trim() || "";
      const description = document.getElementById("str-custom-desc")?.value.trim() || "";
      if (!title || !description) return;
      nextStrength = { type: "custom", title, description };
    } else {
      nextStrength = sel.value;
    }

    if (strengthEditor.index === null) {
      state.strengths.push(nextStrength);
    } else {
      state.strengths[strengthEditor.index] = nextStrength;
    }

    strengthEditor = emptyStrengthEditor();
    scheduleSave();
    renderCharacterPage();
  });

  document.getElementById("str-cancel-btn")?.addEventListener("click", () => {
    strengthEditor = emptyStrengthEditor();
    renderCharacterPage();
  });

  document.querySelectorAll(".str-expand").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.expand;
      const detail = document.getElementById(`detail-${id}`);
      const chevron = btn.querySelector(".chevron");
      detail.classList.toggle("open");
      chevron.classList.toggle("open");
    });
  });

  document.querySelectorAll("[data-edit-custom]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.editCustom);
      const entry = state.strengths[index];
      if (!entry || entry.type !== "custom") return;
      strengthEditor = {
        type: "custom",
        index,
        value: "",
        title: entry.title || "",
        description: entry.description || "",
      };
      renderCharacterPage();
    });
  });

  document.querySelectorAll("[data-remove-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.removeIndex);
      state.strengths.splice(index, 1);
      if (strengthEditor.index === index) strengthEditor = emptyStrengthEditor();
      if (strengthEditor.index !== null && strengthEditor.index > index) {
        strengthEditor = { ...strengthEditor, index: strengthEditor.index - 1 };
      }
      scheduleSave();
      renderCharacterPage();
    });
  });
}

// ─── INVENTORY PAGE ───────────────────────────────────────────────

function renderInventoryPage() {
  const page = document.getElementById("page-inventory");
  page.innerHTML = `
    <div class="sh">Items</div>
    <div id="inv-list">
      ${state.inventory.map((item, i) => `
        <div class="inv-item">
          <span>${esc(item)}</span>
          <button class="str-remove" data-inv-remove="${i}">×</button>
        </div>
      `).join("")}
    </div>
    <div class="inv-add-row">
      <input class="inv-input" id="inv-input" placeholder="Add item…" type="text" />
      <button class="str-add-btn" id="inv-add-btn">Add</button>
    </div>
  `;

  document.getElementById("inv-add-btn").addEventListener("click", () => {
    const input = document.getElementById("inv-input");
    const val = input.value.trim();
    if (!val) return;
    state.inventory.push(val);
    input.value = "";
    scheduleSave();
    renderInventoryPage();
  });

  document.getElementById("inv-input").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("inv-add-btn").click();
  });

  document.querySelectorAll("[data-inv-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.inventory.splice(parseInt(btn.dataset.invRemove), 1);
      scheduleSave();
      renderInventoryPage();
    });
  });
}

// ─── PARTY PAGE ───────────────────────────────────────────────────

function renderPartyPage() {
  const page = document.getElementById("page-party");
  page.innerHTML = `<div class="sh">Party</div><div id="party-list"><div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">Loading…</div></div>`;
  loadParty();
}

async function loadParty() {
  const [players, metadata] = await Promise.all([
    OBR.party.getPlayers(),
    OBR.room.getMetadata(),
  ]);
  const list = document.getElementById("party-list");
  if (!list) return;

  const sheets = players
    .map(p => ({ player: p, data: metadata[`kob-sheet-${p.id}`] }))
    .filter(({ data }) => data && data.name);

  if (!sheets.length) {
    list.innerHTML = `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">No sheets found.</div>`;
    return;
  }

  list.innerHTML = sheets.map(({ player, data }) => {
    const bonused = AGE_BONUSES[data.age] || [];
    return `
    <div class="party-item">
      <div class="party-header" data-pid="${player.id}">
        <span class="party-player-meta">${esc(data.name)} <span>&bull;</span> <em>${esc(player.name)}</em></span>
        <div class="party-header-right">
          <span class="party-token">${data.tokens ?? 0}</span>
          <span class="chevron party-chevron">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6,2 2,5 6,8"/>
            </svg>
          </span>
        </div>
      </div>
      <div class="party-details" id="pdetail-${player.id}">
        <div class="party-detail-row"><span>Trope</span><span>${esc(tropeLabel(data.trope, data.tropeName))}</span></div>
        <div class="party-detail-row"><span>Age</span><span>${cap(data.age || "—")}</span></div>
        ${STATS.map(s => `
          <div class="party-detail-row">
            <span>${cap(s)}</span>
            <span>${formatStatDie(data.stats?.[s], bonused.includes(s))}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  }).join("");

  list.querySelectorAll(".party-header").forEach(header => {
    header.addEventListener("click", () => {
      const detail = document.getElementById(`pdetail-${header.dataset.pid}`);
      const chevron = header.querySelector(".party-chevron");
      detail.classList.toggle("open");
      chevron.classList.toggle("open");
    });
  });
}

// ─── POWERED CHARACTER PAGE ───────────────────────────────────────

function renderPoweredPage() {
  const page = document.getElementById("page-powered");
  if (!page) return;

  page.innerHTML = `
    <div class="sh">Powered Character</div>
    <div id="powered-content">
      <div class="f" style="justify-content:center;font-size:10px;opacity:0.5;height:48px;align-items:center;">
        Loading…
      </div>
    </div>
  `;

  loadPoweredPage();
}

async function loadPoweredPage() {
  const container = document.getElementById("powered-content");
  if (!container) return;

  const metadata = await OBR.room.getMetadata();
  const powered = getPoweredState(metadata);

  if (!hasPoweredContent(powered)) {
    container.innerHTML = `
      <div class="f" style="justify-content:center;font-size:10px;opacity:0.5;height:48px;align-items:center;">
        The GM has not created a powered character yet.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="powered-field"><span class="pe-label">Name</span><span>${esc(powered.name) || "—"}</span></div>
    <div class="powered-field"><span class="pe-label">Trope</span><span>${esc(tropeLabel(powered.trope, powered.tropeName))}</span></div>
    <div class="powered-field"><span class="pe-label">Age</span><span>${cap(powered.age || "—")}</span></div>
    <div class="sh">Stats</div>
    <div class="sgrid">
      ${(() => {
        const bonused = AGE_BONUSES[powered.age] || [];
        return STATS.map(stat => `
        <div class="si">
          <span class="sn">${cap(stat)}${bonused.includes(stat) ? `<span class="sb">+1</span>` : ""}</span>
          <span class="sd">${formatStatDie(powered.stats?.[stat], bonused.includes(stat))}</span>
        </div>
      `).join("");
      })()}
    </div>
    <div class="sh">Psychic Energy</div>
    <div class="pe-row">
      <span class="pe-label">Current Capacity</span>
      <span class="pe-val">${formatPsychicEnergy(powered.psychicEnergyCurrent, powered.psychicEnergyMax)}</span>
    </div>
    <div class="sh">Inventory</div>
    <div id="powered-inventory-list">
      ${powered.inventory.length
        ? powered.inventory.map(item => `<div class="inv-item"><span>${esc(item)}</span></div>`).join("")
        : `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">No items listed.</div>`}
    </div>
    <div class="sh">Powers</div>
    <div id="powered-powers-list">
      ${renderPowersList(powered.powers)}
    </div>
  `;

  setupPowerExpandListeners(container);
}

// ─── HELPERS ─────────────────────────────────────────────────────

function cap(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function esc(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function tropeOptionLabel(trope) {
  if (trope.id === "custom" && state.tropeName?.trim()) {
    return `Custom: ${state.tropeName.trim()}`;
  }
  return trope.label;
}

function renderPowersList(powers) {
  if (!powers?.length) {
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
          <button class="icon-btn power-expand" data-power-expand="${power.id}">
            <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6,2 2,5 6,8"/>
            </svg>
            <span class="tooltip">Details</span>
          </button>
        </div>
      </div>
      <div class="power-desc" id="power-${power.id}">${esc(power.description)}</div>
    </div>
  `).join("");
}

function setupPowerExpandListeners(container = document) {
  container.querySelectorAll(".power-expand").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.powerExpand;
      const detail = document.getElementById(`power-${id}`);
      const chevron = btn.querySelector(".chevron");
      if (!detail || !chevron) return;
      detail.classList.toggle("open");
      chevron.classList.toggle("open");
    });
  });
}

function getPoweredState(metadata) {
  return {
    name: "",
    trope: "",
    tropeName: "",
    age: "",
    stats: { fight: "", flight: "", brains: "", brawn: "", charm: "", grit: "" },
    psychicEnergyCurrent: "",
    psychicEnergyMax: "",
    powers: [],
    inventory: [],
    ...(metadata[POWERED_KEY] || {}),
    stats: {
      fight: "",
      flight: "",
      brains: "",
      brawn: "",
      charm: "",
      grit: "",
      ...(metadata[POWERED_KEY]?.stats || {}),
    },
  };
}

function hasPoweredContent(powered) {
  return Boolean(
    powered.name ||
    powered.trope ||
    powered.age ||
    powered.inventory.length ||
    powered.powers.length ||
    Object.values(powered.stats || {}).some(Boolean) ||
    powered.psychicEnergyCurrent !== "" ||
    powered.psychicEnergyMax !== ""
  );
}

function formatPsychicEnergy(current, max) {
  const currentValue = current === "" || current === null || current === undefined ? "0" : String(current);
  const maxValue = max === "" || max === null || max === undefined ? "0" : String(max);
  return `${currentValue} out of ${maxValue}`;
}

function formatStatDie(die, bonused) {
  if (!die) return "—";
  return bonused ? `${die}+1` : die;
}

function tropeLabel(id, customName = "") {
  const t = TROPES.find(t => t.id === id);
  if (!t) return "—";
  if (t.id === "custom" && customName.trim()) return customName.trim();
  return t.label;
}