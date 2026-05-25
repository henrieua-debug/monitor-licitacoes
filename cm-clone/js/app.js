// Orquestra estado, navegação e renderização de todas as telas.

const STORAGE_KEY = 'cm-clone-save-v2';

const state = {
  season: 1,
  teams: [],
  userTeamId: null,
  fixtures: [],
  round: 0,
  table: {},
  budget: 0,
  history: [],          // resultados por rodada da temporada corrente
  pendingOffers: [],
  cup: null,
  pendingCupStage: null,
  endOfSeasonPending: false,
  lastSeasonPositions: [], // teamIds em ordem da tabela final (usado para classificar próxima copa)
  seasonHistory: [],    // [{ season, leagueChampion, cupChampion, userPosition, userPoints }]
};

function teamMap() {
  const m = {};
  for (const t of state.teams) m[t.id] = t;
  return m;
}
function userTeam() { return state.teams.find(t => t.id === state.userTeamId); }
function findTeam(id) { return state.teams.find(t => t.id === id); }
function nextRoundFixtures() { return state.fixtures[state.round] || []; }

function bootNew(userTeamId) {
  state.season = 1;
  state.teams = CMData.buildLeague();
  state.userTeamId = userTeamId;
  state.fixtures = CMData.buildFixtures(state.teams.map(t => t.id));
  state.round = 0;
  state.table = CMSeason.emptyTable(state.teams);
  state.budget = Math.round(userTeam().reputation * 250_000);
  state.history = [];
  state.pendingOffers = [];
  state.endOfSeasonPending = false;
  state.lastSeasonPositions = [];
  state.seasonHistory = [];
  const qualifiers = CMCup.pickQualifiers(state.teams, null);
  state.cup = CMCup.initCup(state.teams, qualifiers, CMData.hashString('cup:' + state.season));
  state.pendingCupStage = null;
  CMTransfers.refreshTransferList(state.teams, state.userTeamId, 1);
}

function save() {
  const compact = {
    season: state.season, teams: state.teams, userTeamId: state.userTeamId,
    fixtures: state.fixtures, round: state.round, table: state.table, budget: state.budget,
    history: state.history, cup: state.cup, pendingCupStage: state.pendingCupStage,
    endOfSeasonPending: state.endOfSeasonPending, lastSeasonPositions: state.lastSeasonPositions,
    seasonHistory: state.seasonHistory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
}

function loadSave() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data, { pendingOffers: [] });
    return true;
  } catch { return false; }
}

function wipeSave() { localStorage.removeItem(STORAGE_KEY); }

// ----- Helpers DOM -----

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'onclick') e.addEventListener('click', v);
    else if (k === 'oninput') e.addEventListener('input', v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    if (Array.isArray(c)) { for (const cc of c) if (cc != null) e.appendChild(typeof cc === 'string' ? document.createTextNode(cc) : cc); continue; }
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
};
function money(n) { return 'R$ ' + n.toLocaleString('pt-BR'); }
function crestEl(team, size = 28) {
  const wrap = el('span', { class: 'crest' });
  wrap.innerHTML = CMData.crestSVG(team, size);
  return wrap;
}
function teamLabel(team, size = 22) {
  return el('span', { class: 'team-label' }, crestEl(team, size), el('span', {}, team.name));
}
function statusBadge(p) {
  if (p.status.injured > 0) return el('span', { class: 'badge bad' }, `LES ${p.status.injured}`);
  if (p.status.suspended > 0) return el('span', { class: 'badge warn' }, 'SUS');
  return null;
}

// ----- Topbar e tabs -----

function renderTopbar() {
  const t = userTeam();
  const total = state.fixtures.length;
  $('#topbar').innerHTML = '';
  $('#topbar').append(
    el('div', { class: 'tb-left' },
      crestEl(t, 42),
      el('div', {},
        el('div', { class: 'tb-team' }, t.name),
        el('div', { class: 'tb-sub' }, `Temporada ${state.season} · ${t.city} · Rep. ${t.reputation}`),
      ),
    ),
    el('div', { class: 'tb-right' },
      el('div', { class: 'tb-info' },
        el('div', { class: 'tb-info-label' }, 'Rodada'),
        el('div', { class: 'tb-info-val' }, state.round >= total ? 'Fim' : `${state.round + 1}/${total}`),
      ),
      el('div', { class: 'tb-info' },
        el('div', { class: 'tb-info-label' }, 'Saldo'),
        el('div', { class: 'tb-info-val' }, money(state.budget)),
      ),
      el('button', { class: 'btn ghost', onclick: () => { save(); flash('Jogo salvo.'); } }, 'Salvar'),
    ),
  );
}

function renderTabs(active) {
  const tabs = [
    ['overview', 'Visão geral'],
    ['squad', 'Elenco'],
    ['tactics', 'Tática'],
    ['table', 'Tabela'],
    ['fixtures', 'Calendário'],
    ['cup', 'Copa'],
    ['match', 'Partida'],
    ['market', 'Mercado'],
    ['history', 'Histórico'],
  ];
  $('#tabs').innerHTML = '';
  for (const [id, label] of tabs) {
    const b = el('button', { class: 'tab' + (id === active ? ' active' : ''), onclick: () => navigate(id) }, label);
    $('#tabs').appendChild(b);
  }
}

let currentView = 'overview';
function navigate(view) { currentView = view; render(); }

function render() {
  renderTopbar();
  renderTabs(currentView);
  const root = $('#view');
  root.innerHTML = '';
  if (state.endOfSeasonPending) { root.appendChild(renderSeasonEnd()); return; }
  switch (currentView) {
    case 'overview': root.appendChild(renderOverview()); break;
    case 'squad':    root.appendChild(renderSquad()); break;
    case 'tactics':  root.appendChild(renderTactics()); break;
    case 'table':    root.appendChild(renderTable()); break;
    case 'fixtures': root.appendChild(renderFixtures()); break;
    case 'cup':      root.appendChild(renderCup()); break;
    case 'match':    root.appendChild(renderMatch()); break;
    case 'market':   root.appendChild(renderMarket()); break;
    case 'history':  root.appendChild(renderHistory()); break;
  }
}

// ----- Overview -----

function renderOverview() {
  const tm = teamMap();
  const sorted = CMSeason.sortedTable(state.table, tm);
  const userRow = sorted.findIndex(r => r.teamId === state.userTeamId);
  const next = nextRoundFixtures().find(f => f.home === state.userTeamId || f.away === state.userTeamId);
  const wrap = el('div', { class: 'grid-2' });

  wrap.appendChild(el('section', { class: 'card' },
    el('h2', {}, 'Temporada'),
    el('div', { class: 'kv' }, el('div', {}, 'Posição'), el('div', { class: 'strong' }, userRow >= 0 ? `${userRow + 1}º de ${sorted.length}` : '—')),
    el('div', { class: 'kv' }, el('div', {}, 'Pontos'), el('div', { class: 'strong' }, userRow >= 0 ? String(sorted[userRow].Pts) : '0')),
    el('div', { class: 'kv' }, el('div', {}, 'Saldo de gols'), el('div', { class: 'strong' }, userRow >= 0 ? String(sorted[userRow].SG) : '0')),
    el('div', { class: 'kv' }, el('div', {}, 'Copa'), el('div', { class: 'strong' }, cupStatusLabel())),
  ));

  if (state.pendingCupStage) {
    const myCup = CMCup.getUserCupMatch(state.cup, state.pendingCupStage, state.userTeamId);
    if (myCup) {
      const opp = findTeam(myCup.home === state.userTeamId ? myCup.away : myCup.home);
      wrap.appendChild(el('section', { class: 'card accent' },
        el('h2', {}, `Próxima: ${CMCup.STAGE_NAMES[state.pendingCupStage]}`),
        el('div', { class: 'match-row' },
          el('div', { class: 'match-side' }, teamLabel(userTeam())),
          el('div', { class: 'match-vs' }, 'vs'),
          el('div', { class: 'match-side right' }, teamLabel(opp)),
        ),
        el('button', { class: 'btn primary', onclick: () => navigate('match') }, 'Ir para a partida →'),
      ));
    } else {
      wrap.appendChild(el('section', { class: 'card' },
        el('h2', {}, `Copa: ${CMCup.STAGE_NAMES[state.pendingCupStage]}`),
        el('p', { class: 'muted' }, 'Seu clube não está nesta fase. Avance para simular os outros jogos.'),
        el('button', { class: 'btn primary', onclick: () => { autoPlayCupStage(); save(); render(); } }, 'Simular fase'),
      ));
    }
  } else if (next) {
    const home = tm[next.home], away = tm[next.away];
    wrap.appendChild(el('section', { class: 'card' },
      el('h2', {}, 'Próxima partida'),
      el('div', { class: 'match-row' },
        el('div', { class: 'match-side' }, teamLabel(home)),
        el('div', { class: 'match-vs' }, 'vs'),
        el('div', { class: 'match-side right' }, teamLabel(away)),
      ),
      el('div', { class: 'kv' }, el('div', {}, 'Mando'), el('div', { class: 'strong' }, next.home === state.userTeamId ? 'Em casa' : 'Fora')),
      el('button', { class: 'btn primary', onclick: () => navigate('match') }, 'Ir para a partida →'),
    ));
  } else {
    wrap.appendChild(el('section', { class: 'card' },
      el('h2', {}, 'Temporada na reta final'),
      el('p', { class: 'muted' }, 'Sem mais rodadas pendentes.'),
    ));
  }

  if (state.history.length) {
    const last = state.history[state.history.length - 1];
    const card = el('section', { class: 'card span-2' },
      el('h2', {}, `Rodada ${last.round} — resultados`),
      ...last.results.map(r => {
        const h = tm[r.home], a = tm[r.away];
        const youInIt = r.home === state.userTeamId || r.away === state.userTeamId;
        return el('div', { class: 'result-row' + (youInIt ? ' me' : '') },
          el('div', { class: 'result-team' }, teamLabel(h, 20)),
          el('div', { class: 'result-score' }, `${r.homeGoals} – ${r.awayGoals}`),
          el('div', { class: 'result-team right' }, teamLabel(a, 20)),
        );
      }),
    );
    wrap.appendChild(card);
  }

  return wrap;
}

function cupStatusLabel() {
  if (!state.cup) return '—';
  if (state.cup.champion) {
    const champion = findTeam(state.cup.champion);
    return champion ? `Campeão: ${champion.name}` : 'Decidido';
  }
  const stillIn = state.cup.rounds.some(r => r.matches.some(m => (m.home === state.userTeamId || m.away === state.userTeamId) && !m.result));
  return stillIn ? 'Classificado' : 'Eliminado';
}

// ----- Elenco -----

function renderSquad() {
  const t = userTeam();
  const { xi } = CMEngine.pickStartingXI(t, t.formation, t.lineup);
  const starterIds = new Set(xi.map(p => p.id));
  const reserves = t.squad.filter(p => !starterIds.has(p.id));
  const wrap = el('div', {});
  wrap.appendChild(squadTable('Titulares atuais', xi, false));
  wrap.appendChild(squadTable('Reservas', reserves, true));
  return wrap;
}

function squadTable(title, players, allowList) {
  const tbl = el('table', { class: 'data' });
  tbl.innerHTML = `<thead><tr>
    <th>Pos</th><th>Nome</th><th>Idade</th>
    <th class="r">GK</th><th class="r">DEF</th><th class="r">PAS</th><th class="r">TEC</th><th class="r">ATA</th>
    <th class="r">Rating</th><th class="r">Valor</th><th>Status</th>
  </tr></thead>`;
  const tbody = el('tbody');
  for (const p of players) {
    const tr = el('tr', {},
      el('td', { class: 'pos pos-' + p.role }, p.role),
      el('td', {}, p.name),
      el('td', {}, String(p.age)),
      el('td', { class: 'r' }, String(p.attrs.GK)),
      el('td', { class: 'r' }, String(p.attrs.DEF)),
      el('td', { class: 'r' }, String(p.attrs.PASS)),
      el('td', { class: 'r' }, String(p.attrs.TEC)),
      el('td', { class: 'r' }, String(p.attrs.ATK)),
      el('td', { class: 'r strong' }, String(p.rating)),
      el('td', { class: 'r' }, money(p.value)),
      el('td', { class: 'status-cell' },
        statusBadge(p),
        allowList
          ? el('button', { class: 'btn tiny' + (p.transferListed ? ' active' : ''), onclick: () => { CMTransfers.listOwnPlayer(state, p.id, !p.transferListed); render(); } },
              p.transferListed ? 'Listado' : 'Listar')
          : (p.transferListed ? el('span', { class: 'muted' }, 'Listado') : null),
      ),
    );
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  return el('section', { class: 'card' }, el('h2', {}, title), tbl);
}

// ----- Tática (escalação interativa) -----

function renderTactics() {
  const t = userTeam();
  const formation = CMData.FORMATIONS[t.formation];
  const slots = formation.slots;
  const lineup = (t.lineup && t.lineup.length === slots.length) ? t.lineup.slice() : new Array(slots.length).fill(null);

  // Completar slots vazios automaticamente com o melhor disponível.
  const { xi: filled } = CMEngine.pickStartingXI(t, t.formation, lineup);
  // Mapeia jogadores do XI gerado de volta para os slots originais.
  const filledIds = filled.map(p => p ? p.id : null);
  const slotPlayers = new Array(slots.length).fill(null);
  const used = new Set();
  for (let i = 0; i < slots.length; i++) {
    const pid = lineup[i];
    if (pid) {
      const p = t.squad.find(x => x.id === pid && x.role === slots[i].role && CMEngine.isAvailable(x));
      if (p) { slotPlayers[i] = p; used.add(p.id); continue; }
    }
    // Procurar próximo do filled que case com role do slot.
    for (const f of filled) {
      if (!f || used.has(f.id)) continue;
      if (f.role === slots[i].role) { slotPlayers[i] = f; used.add(f.id); break; }
    }
  }

  const wrap = el('div', {});

  // Seletor de formação
  const formCard = el('section', { class: 'card' });
  formCard.appendChild(el('h2', {}, 'Formação'));
  const formBar = el('div', { class: 'formation-bar' });
  for (const fn of CMData.FORMATION_NAMES) {
    const f = CMData.FORMATIONS[fn];
    const btn = el('button', {
      class: 'form-btn' + (fn === t.formation ? ' active' : ''),
      onclick: () => { t.formation = fn; t.lineup = null; save(); render(); },
    }, fn);
    btn.title = `Def x${f.defMod.toFixed(2)} · Atk x${f.attMod.toFixed(2)}`;
    formBar.appendChild(btn);
  }
  formCard.appendChild(formBar);
  formCard.appendChild(el('div', { class: 'formation-mods' },
    el('span', {}, `Def ×${formation.defMod.toFixed(2)}`),
    el('span', {}, `Atk ×${formation.attMod.toFixed(2)}`),
    el('button', { class: 'btn tiny', onclick: () => { t.lineup = null; save(); render(); } }, 'Auto-escalar'),
  ));
  wrap.appendChild(formCard);

  // Campo
  const pitchCard = el('section', { class: 'card' }, el('h2', {}, 'Escalação'));
  const pitch = el('div', { class: 'pitch' });
  pitch.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="pitch-bg">
      <rect x="0" y="0" width="100" height="100" fill="#2c7a3d"/>
      <rect x="0" y="0" width="100" height="100" fill="url(#stripes)" opacity="0.15"/>
      <defs><pattern id="stripes" width="10" height="100" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="5" height="100" fill="#000"/></pattern></defs>
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.7"/>
      <line x1="2" y1="50" x2="98" y2="50" stroke="#fff" stroke-width="0.4" opacity="0.7"/>
      <circle cx="50" cy="50" r="9" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.7"/>
      <rect x="30" y="2" width="40" height="14" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.7"/>
      <rect x="30" y="84" width="40" height="14" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.7"/>
    </svg>
  `;
  slots.forEach((slot, i) => {
    const p = slotPlayers[i];
    const node = el('div', {
      class: 'pitch-slot pos-bg-' + slot.role + (p ? '' : ' empty'),
      style: `left:${slot.x}%;top:${slot.y}%`,
      onclick: () => openPlayerPicker(i),
    },
      el('div', { class: 'pitch-slot-role' }, slot.role),
      el('div', { class: 'pitch-slot-name' }, p ? lastName(p.name) : '—'),
      el('div', { class: 'pitch-slot-rating' }, p ? String(p.rating) : ''),
    );
    pitch.appendChild(node);
  });
  pitchCard.appendChild(pitch);
  wrap.appendChild(pitchCard);

  // Reservas listadas
  const used2 = new Set(slotPlayers.filter(Boolean).map(p => p.id));
  const reserves = t.squad.filter(p => !used2.has(p.id));
  wrap.appendChild(squadTable('Reservas', reserves, true));

  // Persiste lineup atual no estado do time.
  t.lineup = slotPlayers.map(p => p ? p.id : null);

  return wrap;
}

function lastName(full) {
  const parts = full.split(' ');
  return parts[parts.length - 1];
}

function openPlayerPicker(slotIndex) {
  const t = userTeam();
  const slots = CMData.FORMATIONS[t.formation].slots;
  const slot = slots[slotIndex];
  const inUse = new Set((t.lineup || []).filter(Boolean));
  const eligible = t.squad
    .filter(p => p.role === slot.role)
    .sort((a, b) => b.rating - a.rating);

  const modal = el('div', { class: 'modal-backdrop', onclick: e => { if (e.target === e.currentTarget) closeModal(); } });
  const box = el('div', { class: 'modal' });
  box.appendChild(el('div', { class: 'modal-head' },
    el('h3', {}, `Escolher ${slot.role}`),
    el('button', { class: 'btn ghost tiny', onclick: closeModal }, 'Fechar'),
  ));
  const list = el('div', { class: 'picker-list' });
  // Opção: deixar vazio (volta a auto)
  list.appendChild(el('button', { class: 'picker-row', onclick: () => { t.lineup[slotIndex] = null; save(); closeModal(); render(); } },
    el('span', { class: 'muted' }, '— Deixar vazio (auto) —'),
  ));
  for (const p of eligible) {
    const unavailable = !CMEngine.isAvailable(p);
    const row = el('button', {
      class: 'picker-row' + (inUse.has(p.id) ? ' used' : '') + (unavailable ? ' unavailable' : ''),
      onclick: () => {
        if (unavailable) return;
        // Remove de outros slots primeiro
        if (t.lineup) for (let i = 0; i < t.lineup.length; i++) if (t.lineup[i] === p.id) t.lineup[i] = null;
        t.lineup[slotIndex] = p.id;
        save();
        closeModal();
        render();
      },
    },
      el('div', { class: 'picker-name' }, p.name, statusBadge(p)),
      el('div', { class: 'picker-meta muted' }, `${p.age}a · GK ${p.attrs.GK} · DEF ${p.attrs.DEF} · PAS ${p.attrs.PASS} · TEC ${p.attrs.TEC} · ATA ${p.attrs.ATK}`),
      el('div', { class: 'picker-rating strong' }, String(p.rating)),
    );
    list.appendChild(row);
  }
  box.appendChild(list);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.remove());
}

// ----- Tabela -----

function renderTable() {
  const tm = teamMap();
  const rows = CMSeason.sortedTable(state.table, tm);
  const tbl = el('table', { class: 'data' });
  tbl.innerHTML = `<thead><tr>
    <th>#</th><th>Time</th>
    <th class="r">P</th><th class="r">V</th><th class="r">E</th><th class="r">D</th>
    <th class="r">GP</th><th class="r">GC</th><th class="r">SG</th><th class="r">Pts</th>
  </tr></thead>`;
  const tbody = el('tbody');
  rows.forEach((r, i) => {
    const tr = el('tr', { class: r.teamId === state.userTeamId ? 'me' : '' },
      el('td', {}, String(i + 1)),
      el('td', {}, teamLabel(r.team, 20)),
      el('td', { class: 'r' }, String(r.P)),
      el('td', { class: 'r' }, String(r.V)),
      el('td', { class: 'r' }, String(r.E)),
      el('td', { class: 'r' }, String(r.D)),
      el('td', { class: 'r' }, String(r.GP)),
      el('td', { class: 'r' }, String(r.GC)),
      el('td', { class: 'r' }, String(r.SG)),
      el('td', { class: 'r strong' }, String(r.Pts)),
    );
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  return el('section', { class: 'card' }, el('h2', {}, 'Classificação'), tbl);
}

// ----- Calendário -----

function renderFixtures() {
  const tm = teamMap();
  const wrap = el('section', { class: 'card' }, el('h2', {}, 'Calendário'));
  state.fixtures.forEach((round, idx) => {
    const isPast = idx < state.round;
    const isCurr = idx === state.round;
    const sec = el('div', { class: 'fixture-round' + (isCurr ? ' current' : '') });
    sec.appendChild(el('div', { class: 'fixture-head' }, `Rodada ${idx + 1}` + (isCurr ? ' · próxima' : isPast ? ' · jogada' : '')));
    for (const f of round) {
      const past = state.history.find(h => h.round === idx + 1)?.results.find(r => r.home === f.home && r.away === f.away);
      const row = el('div', { class: 'fixture-row' + ((f.home === state.userTeamId || f.away === state.userTeamId) ? ' me' : '') },
        el('div', { class: 'fixture-home' }, teamLabel(tm[f.home], 18)),
        el('div', { class: 'fixture-score' }, past ? `${past.homeGoals} – ${past.awayGoals}` : '—'),
        el('div', { class: 'fixture-away' }, teamLabel(tm[f.away], 18)),
      );
      sec.appendChild(row);
    }
    wrap.appendChild(sec);
  });
  return wrap;
}

// ----- Copa -----

function renderCup() {
  const cup = state.cup;
  const tm = teamMap();
  const wrap = el('div', {});
  if (!cup) {
    wrap.appendChild(el('section', { class: 'card' }, el('h2', {}, 'Copa'), el('p', { class: 'muted' }, 'Copa não iniciada.')));
    return wrap;
  }
  const bracket = el('section', { class: 'card' }, el('h2', {}, `Copa · Temporada ${state.season}`));
  const grid = el('div', { class: 'bracket' });
  for (const round of cup.rounds) {
    const col = el('div', { class: 'bracket-col' });
    col.appendChild(el('div', { class: 'bracket-stage' }, CMCup.STAGE_NAMES[round.stage]));
    if (round.matches.length === 0) {
      col.appendChild(el('div', { class: 'bracket-empty muted' }, 'A definir'));
    }
    for (const m of round.matches) {
      const h = tm[m.home], a = tm[m.away];
      const winner = m.result ? CMCup.decideWinner(m) : null;
      const me = (m.home === state.userTeamId || m.away === state.userTeamId);
      const mEl = el('div', { class: 'bracket-match' + (me ? ' me' : '') },
        el('div', { class: 'bm-side' + (winner === m.home ? ' winner' : '') },
          teamLabel(h, 18),
          el('span', { class: 'bm-score' }, m.result ? String(m.result.homeGoals) : '—'),
        ),
        el('div', { class: 'bm-side' + (winner === m.away ? ' winner' : '') },
          teamLabel(a, 18),
          el('span', { class: 'bm-score' }, m.result ? String(m.result.awayGoals) : '—'),
        ),
      );
      col.appendChild(mEl);
    }
    grid.appendChild(col);
  }
  bracket.appendChild(grid);
  if (cup.champion) {
    const champ = findTeam(cup.champion);
    bracket.appendChild(el('div', { class: 'cup-champ' },
      crestEl(champ, 36), el('strong', {}, `${champ.name} — Campeão!`),
    ));
  }
  wrap.appendChild(bracket);
  return wrap;
}

// ----- Partida -----

let matchTimer = null;
let matchView = null;

function renderMatch() {
  // Cup tem prioridade se houver fase pendente.
  if (state.pendingCupStage) return renderCupMatch();
  const fix = nextRoundFixtures();
  if (!fix.length) {
    return el('section', { class: 'card' }, el('h2', {}, 'Temporada concluída'), el('p', { class: 'muted' }, 'Sem partidas restantes.'));
  }
  const myMatch = fix.find(f => f.home === state.userTeamId || f.away === state.userTeamId);
  if (!myMatch) {
    return el('section', { class: 'card' }, el('h2', {}, 'Sem jogo nesta rodada'),
      el('button', { class: 'btn primary', onclick: () => { quickResolveRound(); render(); } }, 'Simular rodada'));
  }
  return buildMatchCard(myMatch, 'league');
}

function renderCupMatch() {
  const cupMatch = CMCup.getUserCupMatch(state.cup, state.pendingCupStage, state.userTeamId);
  if (!cupMatch) {
    return el('section', { class: 'card' },
      el('h2', {}, `${CMCup.STAGE_NAMES[state.pendingCupStage]} — sem jogo seu`),
      el('p', { class: 'muted' }, 'Seu clube não está nesta fase. Pode simular os outros confrontos.'),
      el('button', { class: 'btn primary', onclick: () => { autoPlayCupStage(); save(); render(); } }, 'Simular fase'),
    );
  }
  return buildMatchCard(cupMatch, 'cup');
}

function buildMatchCard(fixture, kind) {
  const home = findTeam(fixture.home);
  const away = findTeam(fixture.away);
  const titlePrefix = kind === 'cup' ? CMCup.STAGE_NAMES[state.pendingCupStage] : `Rodada ${state.round + 1}`;
  matchView = {
    feed: el('div', { class: 'feed' }),
    score: el('div', { class: 'big-score' }, '0 – 0'),
    btnPlay: null,
  };
  const card = el('section', { class: 'card' },
    el('h2', {}, `${titlePrefix} · ${home.name} vs ${away.name}`),
    el('div', { class: 'scoreboard' },
      el('div', { class: 'sb-side' }, crestEl(home, 40), el('div', {}, home.name)),
      matchView.score,
      el('div', { class: 'sb-side right' }, el('div', {}, away.name), crestEl(away, 40)),
    ),
    matchView.feed,
    el('div', { class: 'match-actions' },
      matchView.btnPlay = el('button', { class: 'btn primary', onclick: () => playMatch(fixture, home, away, kind) }, '▶ Iniciar partida (assistir)'),
      kind === 'league'
        ? el('button', { class: 'btn', onclick: () => { quickResolveRound(); render(); } }, 'Simular rodada inteira')
        : el('button', { class: 'btn', onclick: () => { autoPlayCupStage(); save(); render(); } }, 'Simular fase inteira'),
    ),
  );
  return card;
}

function playMatch(fixture, home, away, kind) {
  matchView.btnPlay.disabled = true;
  matchView.btnPlay.textContent = 'Em andamento...';
  const seedKey = kind === 'cup'
    ? `cup:${state.season}:${state.pendingCupStage}:${fixture.home}:${fixture.away}`
    : `${state.season}:${state.round}:${fixture.home}:${fixture.away}`;
  const seed = CMData.hashString(seedKey);
  // Lineup forçado só para o time do usuário; o outro lado é automático.
  const opts = {};
  if (fixture.home === state.userTeamId) opts.homeLineup = home.lineup;
  if (fixture.away === state.userTeamId) opts.awayLineup = away.lineup;
  const result = CMEngine.simulateMatch(home, away, seed, opts);
  let i = 0, h = 0, a = 0;
  if (matchTimer) clearInterval(matchTimer);
  matchTimer = setInterval(() => {
    if (i >= result.events.length) {
      clearInterval(matchTimer);
      matchTimer = null;
      if (kind === 'cup') finishUserCupMatch(fixture, result);
      else finishUserLeagueRound(fixture, result);
      return;
    }
    const ev = result.events[i++];
    if (ev.type === 'goal') {
      if (ev.side === 'home') h++; else a++;
      matchView.score.textContent = `${h} – ${a}`;
    }
    const cls = 'feed-line ' + (ev.type === 'goal' ? 'goal' : ev.type === 'final' ? 'final' : ev.type === 'red' ? 'red' : ev.type === 'yellow' ? 'yellow' : ev.type === 'injury' ? 'inj' : '');
    const line = el('div', { class: cls }, ev.text);
    matchView.feed.appendChild(line);
    matchView.feed.scrollTop = matchView.feed.scrollHeight;
  }, 80);
}

function finishUserLeagueRound(userFixture, userResult) {
  const round = nextRoundFixtures();
  const results = [];
  for (const f of round) {
    if (f === userFixture) {
      results.push({ home: f.home, away: f.away, homeGoals: userResult.homeGoals, awayGoals: userResult.awayGoals });
      CMSeason.applyResult(state.table, userResult);
      CMSeason.applySideEffects(state, userResult.sideEffects);
    } else {
      const home = findTeam(f.home);
      const away = findTeam(f.away);
      const seed = CMData.hashString(`${state.season}:${state.round}:${f.home}:${f.away}`);
      const r = CMEngine.simulateMatch(home, away, seed);
      CMSeason.applyResult(state.table, r);
      CMSeason.applySideEffects(state, r.sideEffects);
      results.push({ home: f.home, away: f.away, homeGoals: r.homeGoals, awayGoals: r.awayGoals });
    }
  }
  state.history.push({ round: state.round + 1, results });
  state.round++;
  postRoundActions();
  save();
  matchView.btnPlay.textContent = 'Rodada concluída — voltar';
  matchView.btnPlay.disabled = false;
  matchView.btnPlay.onclick = null;
  matchView.btnPlay.addEventListener('click', () => navigate('overview'));
}

function quickResolveRound() {
  const round = nextRoundFixtures();
  if (!round.length) return;
  const results = [];
  for (const f of round) {
    const home = findTeam(f.home);
    const away = findTeam(f.away);
    const opts = {};
    if (f.home === state.userTeamId) opts.homeLineup = home.lineup;
    if (f.away === state.userTeamId) opts.awayLineup = away.lineup;
    const seed = CMData.hashString(`${state.season}:${state.round}:${f.home}:${f.away}`);
    const r = CMEngine.simulateMatch(home, away, seed, opts);
    CMSeason.applyResult(state.table, r);
    CMSeason.applySideEffects(state, r.sideEffects);
    results.push({ home: f.home, away: f.away, homeGoals: r.homeGoals, awayGoals: r.awayGoals });
  }
  state.history.push({ round: state.round + 1, results });
  state.round++;
  postRoundActions();
  save();
}

function finishUserCupMatch(userMatch, userResult) {
  CMSeason.applySideEffects(state, userResult.sideEffects);
  CMCup.playCupStage(state, state.pendingCupStage, { match: userMatch, result: userResult }, CMData.hashString('cupstage:' + state.season + ':' + state.pendingCupStage));
  // Aplica efeitos colaterais dos outros jogos da fase.
  for (const m of CMCup.stageMatches(state.cup, state.pendingCupStage)) {
    if (m !== userMatch && m.result) CMSeason.applySideEffects(state, m.result.sideEffects);
  }
  finalizeCupStage();
  save();
  matchView.btnPlay.textContent = 'Fase concluída — voltar';
  matchView.btnPlay.disabled = false;
  matchView.btnPlay.onclick = null;
  matchView.btnPlay.addEventListener('click', () => navigate('overview'));
}

function autoPlayCupStage() {
  CMCup.playCupStage(state, state.pendingCupStage, null, CMData.hashString('cupstage:' + state.season + ':' + state.pendingCupStage));
  for (const m of CMCup.stageMatches(state.cup, state.pendingCupStage)) {
    if (m.result) CMSeason.applySideEffects(state, m.result.sideEffects);
  }
  finalizeCupStage();
}

function finalizeCupStage() {
  state.pendingCupStage = null;
  // Se já são as 3 fases concluídas e estamos no fim da liga, fim de temporada.
  checkSeasonEnd();
}

function postRoundActions() {
  CMSeason.tickStatuses(state.teams);
  if (state.round % 3 === 0) {
    CMTransfers.refreshTransferList(state.teams, state.userTeamId, state.round + state.season * 31);
    state.pendingOffers = CMTransfers.processOutgoingOffers(state, state.round + state.season * 11);
  }
  // Gatilho da copa após rodadas específicas.
  const stage = CMCup.stageDueAfterRound(state.round);
  if (stage) state.pendingCupStage = stage;
  checkSeasonEnd();
}

function checkSeasonEnd() {
  const lastRound = state.fixtures.length;
  if (state.round >= lastRound && !state.pendingCupStage && state.cup && state.cup.champion) {
    state.endOfSeasonPending = true;
  }
}

// ----- Mercado -----

function renderMarket() {
  const wrap = el('div', {});
  if (state.pendingOffers.length) {
    const card = el('section', { class: 'card warn' },
      el('h2', {}, 'Ofertas recebidas'),
      ...state.pendingOffers.map(off => el('div', { class: 'offer-row' },
        el('div', {},
          el('div', { class: 'strong' }, off.player.name),
          el('div', { class: 'muted' }, `${off.player.role} · Rating ${off.player.rating} · Idade ${off.player.age}`),
        ),
        el('div', { class: 'strong' }, money(off.offer)),
        el('div', { class: 'muted' }, `Comprador: ${off.buyer.name}`),
        el('div', {},
          el('button', { class: 'btn primary tiny', onclick: () => {
            const msg = CMTransfers.acceptOffer(state, off);
            state.pendingOffers = state.pendingOffers.filter(o => o !== off);
            flash(msg); render();
          } }, 'Aceitar'),
          el('button', { class: 'btn tiny', onclick: () => {
            state.pendingOffers = state.pendingOffers.filter(o => o !== off);
            render();
          } }, 'Recusar'),
        ),
      )),
    );
    wrap.appendChild(card);
  }

  const available = CMTransfers.listAvailable(state.teams, state.userTeamId);
  const tm = teamMap();
  const tbl = el('table', { class: 'data' });
  tbl.innerHTML = `<thead><tr>
    <th>Nome</th><th>Pos</th><th>Idade</th><th class="r">Rating</th>
    <th>Clube</th><th class="r">Valor</th><th class="r">Pedem</th><th>Ação</th>
  </tr></thead>`;
  const tbody = el('tbody');
  for (const p of available) {
    const ask = Math.round(p.value * 1.1);
    const tr = el('tr', {},
      el('td', {}, p.name),
      el('td', { class: 'pos pos-' + p.role }, p.role),
      el('td', {}, String(p.age)),
      el('td', { class: 'r strong' }, String(p.rating)),
      el('td', {}, teamLabel(tm[p.teamId], 18)),
      el('td', { class: 'r' }, money(p.value)),
      el('td', { class: 'r' }, money(ask)),
      el('td', {},
        el('button', { class: 'btn tiny primary', onclick: () => {
          const amount = Number(prompt(`Valor da oferta por ${p.name} (mínimo R$ ${ask.toLocaleString('pt-BR')}):`, String(ask)));
          if (!amount) return;
          const r = CMTransfers.makeOffer(state, p.id, amount);
          flash(r.message);
          if (r.accepted) { save(); render(); }
        } }, 'Oferecer'),
      ),
    );
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  wrap.appendChild(el('section', { class: 'card' }, el('h2', {}, 'Jogadores transferíveis'), tbl));
  return wrap;
}

// ----- Histórico -----

function renderHistory() {
  if (!state.seasonHistory.length) {
    return el('section', { class: 'card' }, el('h2', {}, 'Histórico'),
      el('p', { class: 'muted' }, 'Nenhuma temporada concluída ainda.'));
  }
  const tbl = el('table', { class: 'data' });
  tbl.innerHTML = `<thead><tr>
    <th>Temp.</th><th>Campeão da liga</th><th>Campeão da copa</th>
    <th class="r">Sua posição</th><th class="r">Seus pontos</th>
  </tr></thead>`;
  const tbody = el('tbody');
  for (const h of state.seasonHistory) {
    const champ = findTeam(h.leagueChampion);
    const cupChamp = h.cupChampion ? findTeam(h.cupChampion) : null;
    tbody.appendChild(el('tr', {},
      el('td', {}, String(h.season)),
      el('td', {}, champ ? teamLabel(champ, 18) : '—'),
      el('td', {}, cupChamp ? teamLabel(cupChamp, 18) : '—'),
      el('td', { class: 'r strong' }, h.userPosition ? `${h.userPosition}º` : '—'),
      el('td', { class: 'r' }, String(h.userPoints || 0)),
    ));
  }
  tbl.appendChild(tbody);
  return el('section', { class: 'card' }, el('h2', {}, 'Histórico de temporadas'), tbl);
}

// ----- Fim de temporada -----

function renderSeasonEnd() {
  const tm = teamMap();
  const sorted = CMSeason.sortedTable(state.table, tm);
  const userPos = sorted.findIndex(r => r.teamId === state.userTeamId) + 1;
  const champion = sorted[0];
  const cupChamp = state.cup && state.cup.champion ? findTeam(state.cup.champion) : null;
  const userRow = sorted[userPos - 1];

  const wrap = el('div', { class: 'season-end' });
  wrap.appendChild(el('section', { class: 'card big' },
    el('h2', {}, `Fim da Temporada ${state.season}`),
    el('div', { class: 'awards' },
      el('div', { class: 'award' },
        el('div', { class: 'award-label' }, 'Campeão da liga'),
        crestEl(champion.team, 56),
        el('div', { class: 'award-name' }, champion.team.name),
        el('div', { class: 'muted' }, `${champion.Pts}pts · ${champion.V}V ${champion.E}E ${champion.D}D`),
      ),
      cupChamp ? el('div', { class: 'award' },
        el('div', { class: 'award-label' }, 'Campeão da copa'),
        crestEl(cupChamp, 56),
        el('div', { class: 'award-name' }, cupChamp.name),
      ) : null,
      el('div', { class: 'award' },
        el('div', { class: 'award-label' }, 'Seu desempenho'),
        crestEl(userTeam(), 56),
        el('div', { class: 'award-name' }, `${userPos}º · ${userRow.Pts}pts`),
        el('div', { class: 'muted' }, `${userRow.V}V ${userRow.E}E ${userRow.D}D · SG ${userRow.SG}`),
      ),
    ),
    el('button', { class: 'btn primary', onclick: () => startNewSeason() }, 'Iniciar próxima temporada →'),
  ));

  // Mini-tabela final
  wrap.appendChild(renderTable());
  return wrap;
}

function startNewSeason() {
  const tm = teamMap();
  const sorted = CMSeason.sortedTable(state.table, tm);
  const userPos = sorted.findIndex(r => r.teamId === state.userTeamId) + 1;
  const userRow = sorted[userPos - 1];

  state.seasonHistory.push({
    season: state.season,
    leagueChampion: sorted[0].teamId,
    cupChampion: state.cup ? state.cup.champion : null,
    userPosition: userPos,
    userPoints: userRow.Pts,
  });
  state.lastSeasonPositions = sorted.map(r => r.teamId);

  const { retired } = CMSeason.endOfSeason(state);

  state.season++;
  state.fixtures = CMData.buildFixtures(state.teams.map(t => t.id));
  state.round = 0;
  state.table = CMSeason.emptyTable(state.teams);
  state.history = [];
  state.pendingOffers = [];
  state.endOfSeasonPending = false;
  // Limpa lineup do usuário (jogadores podem ter saído).
  const me = userTeam();
  me.lineup = null;
  // Nova copa: top 8 da temporada anterior.
  const qualifiers = CMCup.pickQualifiers(state.teams, state.lastSeasonPositions);
  state.cup = CMCup.initCup(state.teams, qualifiers, CMData.hashString('cup:' + state.season));
  state.pendingCupStage = null;
  CMTransfers.refreshTransferList(state.teams, state.userTeamId, state.season * 41);
  save();
  const myRetired = retired.filter(r => r.teamId === state.userTeamId);
  if (myRetired.length) flash(`${myRetired.length} aposentadoria${myRetired.length > 1 ? 's' : ''} no seu elenco. Confira a tática.`);
  navigate('overview');
}

// ----- Flash -----

let flashTimer = null;
function flash(msg) {
  const f = $('#flash');
  f.textContent = msg;
  f.classList.add('show');
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => f.classList.remove('show'), 2600);
}

// ----- Tela inicial -----

function renderHome() {
  $('#app').style.display = 'none';
  $('#home').style.display = 'block';
  const list = $('#team-list');
  list.innerHTML = '';
  for (const t of CMData.TEAMS) {
    const btn = el('button', { class: 'team-pick', onclick: () => { bootNew(t.id); save(); showApp(); } },
      crestEl(t, 44),
      el('div', { class: 'tp-info' },
        el('div', { class: 'tp-name' }, t.name),
        el('div', { class: 'tp-meta' }, `${t.city} · Rep. ${t.reputation}`),
      ),
    );
    list.appendChild(btn);
  }
}

function showApp() {
  $('#home').style.display = 'none';
  $('#app').style.display = 'block';
  navigate('overview');
}

window.addEventListener('DOMContentLoaded', () => {
  $('#new-game-btn')?.addEventListener('click', () => {
    if (confirm('Começar um novo jogo apaga o save atual. Continuar?')) {
      wipeSave(); renderHome();
    }
  });
  if (loadSave()) {
    // Migração leve: se faltar campos novos, garante presença.
    state.cup = state.cup || null;
    state.pendingCupStage = state.pendingCupStage || null;
    state.seasonHistory = state.seasonHistory || [];
    state.season = state.season || 1;
    for (const t of state.teams) {
      t.formation = t.formation || '4-4-2';
      t.lineup = t.lineup || null;
      for (const p of t.squad) p.status = p.status || CMData.emptyStatus();
    }
    showApp();
  } else {
    renderHome();
  }
});
