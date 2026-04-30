import OBR from "@owlbear-rodeo/sdk";

const STATS = ["brains", "brawn", "charm", "fight", "flight", "grit"];

const AGE_LABELS = {
  kid:   "Kid (+1 Brains, Flight)",
  teen:  "Teen (+1 Brawn, Fight)",
  adult: "Adult (+1 Charm, Grit)",
};

export function initGM(app) {
  app.innerHTML = `
    <div class="card">
      <p class="section-label">Party</p>
      <div id="party-list">
        <p class="empty-state">No character sheets found.</p>
      </div>
    </div>
  `;

  loadParty();

  OBR.room.onMetadataChange(newMetadata => {
    OBR.party.getPlayers().then(players => renderParty(players, newMetadata));
  });
}

async function loadParty() {
  const [players, metadata] = await Promise.all([
    OBR.party.getPlayers(),
    OBR.room.getMetadata(),
  ]);
  renderParty(players, metadata);
}

function renderParty(players, metadata) {
  const list = document.getElementById("party-list");
  list.innerHTML = "";

  const sheets = players
    .map(p => ({ player: p, data: metadata[`kob-sheet-${p.id}`] }))
    .filter(({ data }) => data && data.name);

  if (sheets.length === 0) {
    list.innerHTML = `<p class="empty-state">No character sheets found.</p>`;
    return;
  }

  sheets.forEach(({ player, data }) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "8px";

    const header = document.createElement("div");
    header.className = "player-header";
    header.innerHTML = `
      <span>${data.name || player.name}</span>
      <span class="chevron">▶</span>
    `;

    const details = document.createElement("div");
    details.className = "player-details";

    const ageLabel = AGE_LABELS[data.age] || "—";

    const statRows = STATS.map(s => {
      const die = data.stats?.[s] || "—";
      return `
        <div class="detail-row">
          <span class="detail-label">${capitalize(s)}</span>
          <span>${die}</span>
        </div>`;
    }).join("");

    const strengthsHtml = (data.strengths || []).length > 0
      ? data.strengths.map(s => `<span class="strength-pill">${s}</span>`).join("")
      : `<span style="font-size:12px; color:#7a8ba0;">None listed</span>`;

    details.innerHTML = `
      <p class="age-line">${ageLabel}</p>
      ${statRows}
      <div class="detail-row">
        <span class="detail-label">Adversity tokens</span>
        <span class="tokens-badge">${data.tokens ?? 0}</span>
      </div>
      <div class="strengths-section">
        <p class="strengths-title">Strengths</p>
        ${strengthsHtml}
      </div>
    `;

    header.addEventListener("click", () => {
      const isOpen = details.classList.toggle("open");
      header.classList.toggle("open", isOpen);
    });

    card.appendChild(header);
    card.appendChild(details);
    list.appendChild(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}