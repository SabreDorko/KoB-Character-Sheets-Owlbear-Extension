import OBR from "@owlbear-rodeo/sdk";

const STATS = ["fight", "flight", "brains", "brawn", "charm", "grit"];
const DIES = ["d20", "d12", "d10", "d8", "d6", "d4"];

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
  
  { id: "laid-back-slacker",        label: "Laid-Back Slacker",      ages: ["teen","adult"],         stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "loner-weirdo",             label: "Loner Weirdo",           ages: ["child","teen"],         stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "overprotective-parent",    label: "Overprotective Parent",  ages: ["adult"],                stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "plastic-beauty",           label: "Plastic Beauty",         ages: ["teen"],                 stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "popular-kid",              label: "Popular Kid",            ages: ["child","teen"],         stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "reclusive-eccentric",      label: "Reclusive Eccentric",    ages: ["adult"],                stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "scout",                    label: "Scout",                  ages: ["child","teen"],         stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "stoic-professional",       label: "Stoic Professional",     ages: ["adult"],                stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "wannabe",                  label: "Wannabe",                ages: ["teen"],                 stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
  { id: "young-provider",           label: "Young Provider",         ages: ["teen"],                 stats: { brains:"d10", brawn:"d6",  charm:"d20", fight:"d4",  flight:"d8",  grit:"d12" } },
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
    <div class="f">
      <span class="fl">Age</span>
      ${ageSelect()}
    </div>
    <div class="sh">Stats</div>
    <div class="sgrid">
      ${STATS.map(s => `
        <div class="si">
          <span class="sn">${cap(s)}${bonused.includes(s) ? `<span class="sb">+1</span>` : ""}</span>
          <select class="sdie" id="stat-${s}">
            <option value="">—</option>
            ${DIES.map(d => `<option value="${d}" ${state.stats[s] === d ? "selected" : ""}>${d}</option>`).join("")}
          </select>
        </div>
      `).join("")}
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
          .filter(s => !state.strengths.includes(s.id) && !grantedIds.includes(s.id))
          .map(s => `<option value="${s.id}">${s.label}</option>`)
          .join("")}
      </select>
      <button class="str-add-btn" id="str-add-btn">Add</button>
    </div>
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
      ${validTropes.map(t => `<option value="${t.id}" ${state.trope === t.id ? "selected" : ""}>${t.label}</option>`).join("")}
      ${invalidTropes.length ? `<optgroup label="Not available for this age">
        ${invalidTropes.map(t => `<option value="${t.id}" disabled>${t.label}</option>`).join("")}
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

function renderStrengthsList(grantedIds) {
  const allActive = [
    ...grantedIds.map(id => ({ id, granted: true })),
    ...state.strengths.filter(id => !grantedIds.includes(id)).map(id => ({ id, granted: false })),
  ];
  if (!allActive.length) return "";
  return allActive.map(({ id, granted }) => {
    const s = STRENGTHS.find(x => x.id === id);
    if (!s) return "";
    return `
      <div class="str" data-sid="${id}">
        <div class="str-left">
          <span class="str-name">${s.label}</span>
          ${granted ? `<span class="str-age">age</span>` : ""}
        </div>
        <div style="display:flex;align-items:center;gap:2px;">
          ${state.editingStrengths && !granted
            ? `<button class="str-remove" data-remove="${id}">×</button>`
            : ""}
          <button class="icon-btn str-expand" data-expand="${id}">
            <svg class="chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="2,3 5,7 8,3"/>
            </svg>
            <span class="tooltip">Details</span>
          </button>
        </div>
      </div>
      <div class="str-detail" id="detail-${id}">${s.desc}</div>
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

  document.getElementById("sel-age").addEventListener("change", e => {
    const newAge = e.target.value;
    if (state.trope && state.trope !== "custom") {
      const trope = TROPES.find(t => t.id === state.trope);
      if (trope && !trope.ages.includes(newAge)) {
        state.trope = "";
      }
    }
    state.age = newAge;
    state.strengths = state.strengths.filter(id => !(AGE_GRANTED[newAge] || []).includes(id));
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
    renderCharacterPage();
  });

  document.getElementById("str-add-btn").addEventListener("click", () => {
    const sel = document.getElementById("str-add-sel");
    if (!sel.value) return;
    state.strengths.push(sel.value);
    scheduleSave();
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

  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.remove;
      state.strengths = state.strengths.filter(s => s !== id);
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

  list.innerHTML = sheets.map(({ player, data }) => `
    <div class="party-item">
      <div class="party-header" data-pid="${player.id}">
        <span>${esc(data.name)}</span>
        <span class="chevron">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2,3 5,7 8,3"/>
          </svg>
        </span>
      </div>
      <div class="party-details" id="pdetail-${player.id}">
        <div class="party-detail-row"><span>Trope</span><span>${tropeLabel(data.trope)}</span></div>
        <div class="party-detail-row"><span>Age</span><span>${cap(data.age || "—")}</span></div>
        ${STATS.map(s => `
          <div class="party-detail-row">
            <span>${cap(s)}</span>
            <span>${data.stats?.[s] || "—"}</span>
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

// ─── POWERED CHARACTER PAGE ───────────────────────────────────────

function renderPoweredPage() {
  const page = document.getElementById("page-powered");
  page.innerHTML = `
    <div class="sh">Powered Character</div>
    <div class="f" style="justify-content:center;font-size:10px;opacity:0.5;height:48px;align-items:center;">
      Only the GM can edit this section.
    </div>
  `;
}

// ─── HELPERS ─────────────────────────────────────────────────────

function cap(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function esc(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function tropeLabel(id) {
  const t = TROPES.find(t => t.id === id);
  return t ? t.label : "—";
}