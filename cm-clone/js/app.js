// Orquestra estado, navegação e renderização das telas.

const STORAGE_KEY = 'cm-clone-save-v1';

const state = {
  teams: [],
  userTeamId: null,
  fixtures: [],
  round: 0,
  table: {},
  budget: 0,
  history: [],
  pendingOffers: [],
};

function teamMap() {
  const m = {};
  for (const t of state.teams) m[t.id] = t;
  return m;
}

function userTeam() { return state.teams.find(t => t.id === state.userTeamId); }
function nextRoundFixtures() { return state.fixtures[state.round] || []; }

function bootNew(userTeamId) {
  state.teams = CMData.buildLeague();
  state.userTeamId = userTeamId;
  state.fixtures = CMData.buildFixtures(state.teams.map(t => t.id));
  state.round = 0;
  state.table = CMSeason.emptyTable(state.teams);
  state.budget = Math.round(userTeam().reputation * 250_000);
  state.history = [];
  state.pendingOffers = [];
  CMTransfers.refreshTransferList(state.teams, state.userTeamId, 1);
}

function save() {
  const compact = {
    teams: state.teams,
    userTeamId: state.userTeamId,
    fixtures: state.fixtures,
    round: state.round,
    table: state.table,
    budget: state.budget,
    history: state.history,
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

function wipeSave() {
  localStorage.removeItem(STORAGE_KEY);
}

// ----- Renderização -----

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
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
};

function money(n) { return 'R$ ' + n.toLocaleString('pt-BR'); }

function renderTopbar() {
  const t = userTeam();
  const round = state.round + 1;
  const total = state.fixtures.length;
  $('#topbar').innerHTML = '';
  $('#topbar').append(
    el('div', { class: 'tb-left' },
      el('div', { class: 'tb-logo' }, t.short),
      el('div', {},
        el('div', { class: 'tb-team' }, t.name),
        el('div', { class: 'tb-sub' }, `${t.city} · Reputação ${t.reputation}`),
      ),
    ),
    el('div', { class: 'tb-right' },
      el('div', { class: 'tb-info' },
        el('div', { class: 'tb-info-label' }, 'Rodada'),
        el('div', { class: 'tb-info-val' }, state.round >= state.fixtures.length ? 'Fim' : `${round}/${total}`),
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
    ['table', 'Tabela'],
    ['fixtures', 'Calendário'],
    ['match', 'Partida'],
    ['market', 'Mercado'],
  ];
  $('#tabs').innerHTML = '';
  for (const [id, label] of tabs) {
    const b = el('button', { class: 'tab' + (id === active ? ' active' : ''), onclick: () => navigate(id) }, label);
    $('#tabs').appendChild(b);
  }
}

let currentView = 'overview';
function navigate(view) {
  currentView = view;
  render();
}

function render() {
  renderTopbar();
  renderTabs(currentView);
  const root = $('#view');
  root.innerHTML = '';
  switch (currentView) {
    case 'overview': root.appendChild(renderOverview()); break;
    case 'squad': root.appendChild(renderSquad()); break;
    case 'table': root.appendChild(renderTable()); break;
    case 'fixtures': root.appendChild(renderFixtures()); break;
    case 'match': root.appendChild(renderMatch()); break;
    case 'market': root.appendChild(renderMarket()); break;
  }
}

function renderOverview() {
  const tm = teamMap();
  const sorted = CMSeason.sortedTable(state.table, tm);
  const userRow = sorted.findIndex(r => r.teamId === state.userTeamId);
  const next = nextRoundFixtures().find(f => f.home === state.userTeamId || f.away === state.userTeamId);
  const wrap = el('div', { class: 'grid-2' });

  const seasonCard = el('section', { class: 'card' },
    el('h2', {}, 'Temporada'),
    el('div', { class: 'kv' },
      el('div', {}, 'Posição'),
      el('div', { class: 'strong' }, userRow >= 0 ? `${userRow + 1}º de ${sorted.length}` : '—'),
    ),
    el('div', { class: 'kv' },
      el('div', {}, 'Pontos'),
      el('div', { class: 'strong' }, userRow >= 0 ? String(sorted[userRow].Pts) : '0'),
    ),
    el('div', { class: 'kv' },
      el('div', {}, 'Saldo de gols'),
      el('div', { class: 'strong' }, userRow >= 0 ? String(sorted[userRow].SG) : '0'),
    ),
  );

  let nextCard;
  if (next) {
    const home = tm[next.home], away = tm[next.away];
    nextCard = el('section', { class: 'card' },
      el('h2', {}, 'Próxima partida'),
      el('div', { class: 'match-row' },
        el('div', { class: 'match-side' }, home.name),
        el('div', { class: 'match-vs' }, 'vs'),
        el('div', { class: 'match-side right' }, away.name),
      ),
      el('div', { class: 'kv' }, el('div', {}, 'Mando'), el('div', { class: 'strong' }, next.home === state.userTeamId ? 'Em casa' : 'Fora')),
      el('button', { class: 'btn primary', onclick: () => navigate('match') }, 'Ir para a partida →'),
    );
  } else {
    nextCard = el('section', { class: 'card' },
      el('h2', {}, 'Temporada concluída'),
      el('p', { class: 'muted' }, 'Não há mais rodadas. Veja a tabela final.'),
    );
  }

  wrap.append(seasonCard, nextCard);

  if (state.history.length) {
    const last = state.history[state.history.length - 1];
    const card = el('section', { class: 'card span-2' },
      el('h2', {}, `Rodada ${last.round} — resultados`),
      ...last.results.map(r => {
        const h = tm[r.home], a = tm[r.away];
        const youInIt = r.home === state.userTeamId || r.away === state.userTeamId;
        return el('div', { class: 'result-row' + (youInIt ? ' me' : '') },
          el('div', { class: 'result-team' }, h.name),
          el('div', { class: 'result-score' }, `${r.homeGoals} – ${r.awayGoals}`),
          el('div', { class: 'result-team right' }, a.name),
        );
      }),
    );
    wrap.appendChild(card);
  }

  return wrap;
}

function renderSquad() {
  const t = userTeam();
  const starters = CMEngine.pickStarting(t.squad);
  const starterIds = new Set(starters.map(p => p.id));
  const reserves = t.squad.filter(p => !starterIds.has(p.id));
  const wrap = el('div', {});
  wrap.appendChild(squadTable('Titulares', starters));
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
      el('td', {},
        allowList
          ? el('button', { class: 'btn tiny' + (p.transferListed ? ' active' : ''), onclick: () => { CMTransfers.listOwnPlayer(state, p.id, !p.transferListed); render(); } },
              p.transferListed ? 'Listado' : 'Listar')
          : (p.transferListed ? 'Listado' : ''),
      ),
    );
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  return el('section', { class: 'card' }, el('h2', {}, title), tbl);
}

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
      el('td', {}, r.team.name),
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
        el('div', { class: 'fixture-home' }, tm[f.home].name),
        el('div', { class: 'fixture-score' }, past ? `${past.homeGoals} – ${past.awayGoals}` : '—'),
        el('div', { class: 'fixture-away' }, tm[f.away].name),
      );
      sec.appendChild(row);
    }
    wrap.appendChild(sec);
  });
  return wrap;
}

let matchTimer = null;
let matchView = null;

function renderMatch() {
  const tm = teamMap();
  const fix = nextRoundFixtures();
  if (!fix.length) {
    return el('section', { class: 'card' }, el('h2', {}, 'Temporada concluída'), el('p', { class: 'muted' }, 'Sem partidas restantes.'));
  }
  const myMatch = fix.find(f => f.home === state.userTeamId || f.away === state.userTeamId);
  if (!myMatch) {
    return el('section', { class: 'card' }, el('h2', {}, 'Sem jogo nesta rodada'),
      el('button', { class: 'btn primary', onclick: () => advanceRound() }, 'Avançar rodada'));
  }
  const home = state.teams.find(t => t.id === myMatch.home);
  const away = state.teams.find(t => t.id === myMatch.away);
  matchView = {
    feed: el('div', { class: 'feed' }),
    score: el('div', { class: 'big-score' }, `0 – 0`),
    btnPlay: null,
  };
  const card = el('section', { class: 'card' },
    el('h2', {}, `Rodada ${state.round + 1} · ${home.name} vs ${away.name}`),
    el('div', { class: 'scoreboard' },
      el('div', { class: 'sb-side' }, home.name),
      matchView.score,
      el('div', { class: 'sb-side right' }, away.name),
    ),
    matchView.feed,
    el('div', { class: 'match-actions' },
      matchView.btnPlay = el('button', { class: 'btn primary', onclick: () => playMatch(myMatch, home, away) }, '▶ Iniciar partida (assistir)'),
      el('button', { class: 'btn', onclick: () => { quickResolveRound(); render(); } }, 'Simular rodada inteira'),
    ),
  );
  return card;
}

function playMatch(fixture, home, away) {
  matchView.btnPlay.disabled = true;
  matchView.btnPlay.textContent = 'Em andamento...';
  const seed = CMData.hashString(`${state.round}:${fixture.home}:${fixture.away}`);
  const result = CMEngine.simulateMatch(home, away, seed);
  let i = 0;
  let h = 0, a = 0;
  if (matchTimer) clearInterval(matchTimer);
  matchTimer = setInterval(() => {
    if (i >= result.events.length) {
      clearInterval(matchTimer);
      matchTimer = null;
      finishRound(result, fixture);
      return;
    }
    const ev = result.events[i++];
    if (ev.type === 'goal') {
      if (ev.side === 'home') h++; else a++;
      matchView.score.textContent = `${h} – ${a}`;
    }
    const line = el('div', { class: 'feed-line' + (ev.type === 'goal' ? ' goal' : '') + (ev.type === 'final' ? ' final' : '') }, ev.text);
    matchView.feed.appendChild(line);
    matchView.feed.scrollTop = matchView.feed.scrollHeight;
  }, 90);
}

function finishRound(userResult, userFixture) {
  // Aplica resultado do usuário + simula os outros jogos da rodada.
  const round = nextRoundFixtures();
  const results = [];
  for (const f of round) {
    if (f === userFixture) {
      results.push({ home: f.home, away: f.away, homeGoals: userResult.homeGoals, awayGoals: userResult.awayGoals });
      CMSeason.applyResult(state.table, userResult);
    } else {
      const home = state.teams.find(t => t.id === f.home);
      const away = state.teams.find(t => t.id === f.away);
      const seed = CMData.hashString(`${state.round}:${f.home}:${f.away}`);
      const r = CMEngine.simulateMatch(home, away, seed);
      CMSeason.applyResult(state.table, r);
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
  const results = [];
  for (const f of round) {
    const home = state.teams.find(t => t.id === f.home);
    const away = state.teams.find(t => t.id === f.away);
    const seed = CMData.hashString(`${state.round}:${f.home}:${f.away}`);
    const r = CMEngine.simulateMatch(home, away, seed);
    CMSeason.applyResult(state.table, r);
    results.push({ home: f.home, away: f.away, homeGoals: r.homeGoals, awayGoals: r.awayGoals });
  }
  state.history.push({ round: state.round + 1, results });
  state.round++;
  postRoundActions();
  save();
}

function advanceRound() {
  // Avança caso o usuário não tenha jogo (não acontece nesta liga, mas placeholder).
  state.round++;
  save();
}

function postRoundActions() {
  // A cada 3 rodadas, atualiza lista de transferíveis e gera ofertas.
  if (state.round % 3 === 0) {
    CMTransfers.refreshTransferList(state.teams, state.userTeamId, state.round + 17);
    state.pendingOffers = CMTransfers.processOutgoingOffers(state, state.round + 99);
  }
}

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
            flash(msg);
            render();
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
      el('td', {}, tm[p.teamId].name),
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

let flashTimer = null;
function flash(msg) {
  const f = $('#flash');
  f.textContent = msg;
  f.classList.add('show');
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => f.classList.remove('show'), 2400);
}

// ----- Tela inicial -----

function renderHome() {
  $('#app').style.display = 'none';
  $('#home').style.display = 'block';
  const list = $('#team-list');
  list.innerHTML = '';
  for (const t of CMData.TEAMS) {
    const btn = el('button', { class: 'team-pick', onclick: () => {
      bootNew(t.id);
      save();
      showApp();
    } },
      el('div', { class: 'tp-name' }, t.name),
      el('div', { class: 'tp-meta' }, `${t.city} · Reputação ${t.reputation}`),
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
  $('#new-game-btn')?.addEventListener('click', () => { wipeSave(); renderHome(); });
  if (loadSave()) {
    showApp();
  } else {
    renderHome();
  }
});
