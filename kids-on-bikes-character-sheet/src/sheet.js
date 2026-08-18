import OBR from "@owlbear-rodeo/sdk";
import TROPES from "./data/tropes.json";
import STRENGTHS from "./data/strengths.json";
import ageRules from "./data/age-rules.json";

const STATS = ["fight", "flight", "brains", "brawn", "charm", "grit"];
const DIES = ["d20", "d12", "d10", "d8", "d6", "d4"];
const POWERED_KEY = "kob-powered-sheet";

const AGE_BONUSES = ageRules.bonuses;

const AGE_GRANTED = ageRules.granted;

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
  notes: [],
  editingStrengths: false,
};

let strengthEditor = emptyStrengthEditor();
let activeNoteId = null;
let noteView = "list";
let currentPlayerId = "";
let editingStats = false;
let cachedMetadata = {};

let metadataListenerBound = false;

let saveTimeout = null;
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 600);
}

async function save() {
  if (!currentPlayerId) currentPlayerId = await OBR.player.getId();
  await OBR.room.setMetadata({ [`kob-sheet-${currentPlayerId}`]: state });
}

async function saveNow() {
  clearTimeout(saveTimeout);
  await save();
}

async function load() {
  currentPlayerId = await OBR.player.getId();
  const metadata = await OBR.room.getMetadata();
  cachedMetadata = metadata;
  const saved = metadata[`kob-sheet-${currentPlayerId}`];
  const localNotes = loadLocalNotes();
  const metadataNotes = normalizeNotes(saved?.notes);
  const mergedNotes = mergeNotesByNewest(metadataNotes, localNotes);
  if (saved) {
    state = {
      ...state,
      ...saved,
      notes: mergedNotes,
    };
  } else {
    state.notes = mergedNotes;
  }

  persistLocalNotes();
}

export async function initSheet(app) {
  await load();
  renderApp(app);

  if (!metadataListenerBound) {
    metadataListenerBound = true;
    OBR.room.onMetadataChange((metadataUpdate) => {
      // Metadata updates can be partial; merge to preserve previously known keys.
      cachedMetadata = { ...cachedMetadata, ...metadataUpdate };
      renderPartyPage(cachedMetadata);
      renderPoweredPage(cachedMetadata);
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
        <div class="top-tab" data-tab="notes">Notes</div>
        <div class="top-tab" data-tab="party">Party</div>
        <div class="top-tab" data-tab="powered">Powered</div>
      </div>
      <div class="page active" data-page="character" id="page-character"></div>
      <div class="page" data-page="inventory" id="page-inventory"></div>
      <div class="page" data-page="notes" id="page-notes"></div>
      <div class="page" data-page="party" id="page-party"></div>
      <div class="page" data-page="powered" id="page-powered"></div>
    </div>
  `;

  renderCharacterPage();
  renderInventoryPage();
  renderNotesPage();
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
      if (tab.dataset.tab === "party") {
        renderPartyPage();
      }
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
    <div class="sh">Stats
      ${state.trope === "custom" ? `
      <button class="icon-btn" id="stats-edit-btn" title="Edit Stats">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/><line x1="6.5" y1="3.5" x2="8.5" y2="5.5"/>
        </svg>
        <span class="tooltip">${editingStats ? "Done" : "Edit Stats"}</span>
      </button>` : ""}
    </div>
    <table class="stats-inline-table" aria-label="Character stats">
      <thead>
        <tr class="stats-inline-label-row">
          ${STATS.map(stat => `<th class="stats-inline-head">${cap(stat)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        <tr class="stats-inline-value-row">
          ${STATS.map(s => {
            const usedDice = Object.entries(state.stats)
              .filter(([stat, die]) => die && stat !== s)
              .map(([_, die]) => die);
            const availableDice = DIES.filter(d => !usedDice.includes(d));
            return `
            <td class="stats-inline-cell">
              ${editingStats
                ? `<div class="stats-inline-edit">
                    <select class="sdie" id="stat-${s}">
                      <option value="">—</option>
                      ${availableDice.map(d => `<option value="${d}" ${state.stats[s] === d ? "selected" : ""}>${d}</option>`).join("")}
                    </select>
                    ${bonused.includes(s) ? `<span class="stats-inline-edit-bonus">+1</span>` : ""}
                  </div>`
                : `<span class="sd">${formatStatDie(state.stats?.[s], bonused.includes(s))}</span>`}
            </td>
          `;
          }).join("")}
        </tr>
      </tbody>
    </table>
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
    if (state.trope !== "custom") editingStats = false;
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
    document.getElementById(`stat-${s}`)?.addEventListener("change", e => {
      state.stats[s] = e.target.value;
      scheduleSave();
    });
  });

  document.getElementById("stats-edit-btn")?.addEventListener("click", () => {
    editingStats = !editingStats;
    renderCharacterPage();
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

// ─── NOTES PAGE ───────────────────────────────────────────────────

function renderNotesPage() {
  const page = document.getElementById("page-notes");
  if (!page) return;

  if (!state.notes.length) {
    activeNoteId = null;
  } else if (!state.notes.some(note => note.id === activeNoteId)) {
    activeNoteId = state.notes[0].id;
  }

  const activeNote = state.notes.find(note => note.id === activeNoteId) || null;
  const orderedNotes = [...state.notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  if (!activeNote) {
    noteView = "list";
  }

  if (noteView === "detail" && activeNote) {
    page.innerHTML = `
      <div class="sh">
        <button class="str-add-btn" id="note-back-btn" type="button">Back</button>
        <span>Note</span>
        <button class="str-add-btn" id="note-add-btn" type="button">New Note</button>
      </div>
      <div class="notes-wrap">
        <div class="notes-editor">
          <input class="note-title-input" id="note-title-input" type="text" value="${esc(activeNote.title)}" placeholder="Note title" />
          <textarea class="note-content-input" id="note-content-input" placeholder="Write your note...">${esc(activeNote.content)}</textarea>
          <div class="notes-actions">
            <button class="str-remove" id="note-delete-btn" type="button" aria-label="Delete note">&times;</button>
          </div>
        </div>
      </div>
    `;

    setupNotesListeners();
    return;
  }

  page.innerHTML = `
    <div class="sh">
      <span>Notes</span>
      <button class="str-add-btn" id="note-add-btn" type="button">New Note</button>
    </div>
    <div class="notes-wrap">
      <div class="notes-list" id="notes-list">
        ${orderedNotes.length
          ? orderedNotes.map(note => `
            <div class="note-item ${note.id === activeNoteId ? "active" : ""}">
              <button class="note-open-btn" data-note-open="${note.id}" type="button">
                <span class="note-item-title">${esc(note.title?.trim() || "Untitled Note")}</span>
                <span class="note-item-preview">${esc(note.content?.trim() || "No content yet")}</span>
              </button>
              <button class="str-remove note-quick-delete" data-note-delete="${note.id}" type="button" aria-label="Delete note">&times;</button>
            </div>
          `).join("")
          : `<div class="notes-helper-row">Create your first note.</div>`}
      </div>
      <div class="notes-helper-row notes-helper-two-lines">Open a note to edit it.</div>
    </div>
  `;

  setupNotesListeners();
}

function setupNotesListeners() {
  document.getElementById("note-add-btn")?.addEventListener("click", () => {
    const newNote = {
      id: createId(),
      title: "",
      content: "",
      updatedAt: Date.now(),
    };
    state.notes.unshift(newNote);
    activeNoteId = newNote.id;
    noteView = "detail";
    persistLocalNotes();
    scheduleSave();
    renderNotesPage();
  });

  document.getElementById("note-back-btn")?.addEventListener("click", () => {
    noteView = "list";
    renderNotesPage();
  });

  document.querySelectorAll("[data-note-open]").forEach(button => {
    button.addEventListener("click", () => {
      activeNoteId = button.dataset.noteOpen;
      noteView = "detail";
      renderNotesPage();
    });
  });

  document.querySelectorAll("[data-note-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const noteId = button.dataset.noteDelete;
      const index = state.notes.findIndex(entry => entry.id === noteId);
      if (index === -1) return;
      state.notes.splice(index, 1);
      if (activeNoteId === noteId) {
        const next = state.notes[index] || state.notes[index - 1] || null;
        activeNoteId = next ? next.id : null;
      }
      noteView = "list";
      persistLocalNotes();
      saveNow();
      renderNotesPage();
    });
  });

  document.getElementById("note-title-input")?.addEventListener("input", event => {
    const note = state.notes.find(entry => entry.id === activeNoteId);
    if (!note) return;
    note.title = event.target.value;
    note.updatedAt = Date.now();
    persistLocalNotes();
    scheduleSave();
  });

  document.getElementById("note-title-input")?.addEventListener("keydown", event => {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      document.getElementById("note-content-input")?.focus();
    }
  });

  document.getElementById("note-title-input")?.addEventListener("blur", () => {
    saveNow();
  });

  document.getElementById("note-content-input")?.addEventListener("input", event => {
    const note = state.notes.find(entry => entry.id === activeNoteId);
    if (!note) return;
    note.content = event.target.value;
    note.updatedAt = Date.now();
    persistLocalNotes();
    scheduleSave();
  });

  document.getElementById("note-content-input")?.addEventListener("keydown", event => {
    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      document.getElementById("note-title-input")?.focus();
    }
  });

  document.getElementById("note-content-input")?.addEventListener("blur", () => {
    saveNow();
  });

  document.getElementById("note-delete-btn")?.addEventListener("click", () => {
    const index = state.notes.findIndex(entry => entry.id === activeNoteId);
    if (index === -1) return;
    state.notes.splice(index, 1);
    const next = state.notes[index] || state.notes[index - 1] || null;
    activeNoteId = next ? next.id : null;
    noteView = activeNoteId ? "detail" : "list";
    persistLocalNotes();
    saveNow();
    renderNotesPage();
  });
}

// ─── PARTY PAGE ───────────────────────────────────────────────────

function renderPartyPage(preloadedMetadata) {
  const page = document.getElementById("page-party");
  if (!page) return;
  page.innerHTML = `<div class="sh">Party</div><div id="party-list"><div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">Loading…</div></div>`;
  loadParty(preloadedMetadata);
}

async function loadParty(preloadedMetadata) {
  try {
  const [players, metadata] = await Promise.all([
    OBR.party.getPlayers(),
    preloadedMetadata ? Promise.resolve(preloadedMetadata) : OBR.room.getMetadata(),
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
  } catch (err) {
    const list = document.getElementById("party-list");
    if (list) list.innerHTML = `<div class="f" style="justify-content:center;font-size:10px;opacity:0.5;">Could not load party data.</div>`;
    console.error("loadParty error:", err);
  }
}

// ─── POWERED CHARACTER PAGE ───────────────────────────────────────

function renderPoweredPage(preloadedMetadata) {
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

  loadPoweredPage(preloadedMetadata);
}

async function loadPoweredPage(preloadedMetadata) {
  const container = document.getElementById("powered-content");
  if (!container) return;

  const metadata = preloadedMetadata ?? await OBR.room.getMetadata();
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
    <table class="stats-inline-table" aria-label="Powered character stats">
      <thead>
        <tr class="stats-inline-label-row">
          ${STATS.map(stat => `<th class="stats-inline-head">${cap(stat)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        <tr class="stats-inline-value-row">
          ${(() => {
            const bonused = AGE_BONUSES[powered.age] || [];
            return STATS.map(stat => `
            <td class="stats-inline-cell"><span class="sd">${formatStatDie(powered.stats?.[stat], bonused.includes(stat))}</span></td>
          `).join("");
          })()}
        </tr>
      </tbody>
    </table>
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

function normalizeNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes
    .filter(note => note && typeof note === "object")
    .map(note => ({
      id: typeof note.id === "string" && note.id ? note.id : createId(),
      title: typeof note.title === "string" ? note.title : "",
      content: typeof note.content === "string" ? note.content : "",
      updatedAt: Number.isFinite(Number(note.updatedAt)) ? Number(note.updatedAt) : Date.now(),
    }));
}

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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

function mergeNotesByNewest(primary, secondary) {
  const byId = new Map();
  [...primary, ...secondary].forEach(note => {
    if (!note?.id) return;
    const existing = byId.get(note.id);
    if (!existing || (note.updatedAt || 0) >= (existing.updatedAt || 0)) {
      byId.set(note.id, note);
    }
  });
  return [...byId.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function localNotesStorageKey() {
  return `kob-local-notes-${currentPlayerId || "unknown"}`;
}

function loadLocalNotes() {
  try {
    const raw = localStorage.getItem(localNotesStorageKey());
    if (!raw) return [];
    return normalizeNotes(JSON.parse(raw));
  } catch {
    return [];
  }
}

function persistLocalNotes() {
  if (!currentPlayerId) return;
  try {
    localStorage.setItem(localNotesStorageKey(), JSON.stringify(state.notes));
  } catch {
    // Best-effort cache only.
  }
}