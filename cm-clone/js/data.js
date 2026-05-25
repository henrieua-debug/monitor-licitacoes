// Dataset fictício. Times, jogadores e nomes são inventados para evitar
// qualquer dependência de bases de jogos comerciais.

const TEAMS = [
  { id: 't1',  name: 'Atlético Solar',    short: 'ATS', city: 'São Paulo',      reputation: 82, colors: { primary: '#F2B705', secondary: '#A02E10' } },
  { id: 't2',  name: 'União Paulista',    short: 'UNP', city: 'Campinas',       reputation: 74, colors: { primary: '#1B4F8B', secondary: '#FFFFFF' } },
  { id: 't3',  name: 'Real Litoral',      short: 'RLT', city: 'Santos',         reputation: 70, colors: { primary: '#0E2A47', secondary: '#E5C76B' } },
  { id: 't4',  name: 'Esporte Andorinha', short: 'AND', city: 'Belo Horizonte', reputation: 68, colors: { primary: '#9B1B1B', secondary: '#1A1A1A' } },
  { id: 't5',  name: 'Cruz do Sul',       short: 'CDS', city: 'Porto Alegre',   reputation: 78, colors: { primary: '#1E7A3B', secondary: '#FFFFFF' } },
  { id: 't6',  name: 'Pacífico FC',       short: 'PAC', city: 'Recife',         reputation: 62, colors: { primary: '#0FA3B1', secondary: '#FFFFFF' } },
  { id: 't7',  name: 'Verde Vale',        short: 'VVL', city: 'Curitiba',       reputation: 66, colors: { primary: '#2E5E1E', secondary: '#161616' } },
  { id: 't8',  name: 'Boreal United',     short: 'BRU', city: 'Manaus',         reputation: 58, colors: { primary: '#5E3A8E', secondary: '#F0C419' } },
  { id: 't9',  name: 'Estrela Náutica',   short: 'EST', city: 'Florianópolis',  reputation: 64, colors: { primary: '#142850', secondary: '#FFD23F' } },
  { id: 't10', name: 'Centauro FC',       short: 'CTR', city: 'Goiânia',        reputation: 72, colors: { primary: '#7A1F2B', secondary: '#E8C25E' } },
];

const FIRST_NAMES = [
  'Lucas','Gabriel','Rafael','Bruno','Diego','Felipe','Mateus','André','Carlos','Pedro',
  'Thiago','Vinícius','Henrique','Igor','Daniel','João','Eduardo','Marcos','Renato','Júlio',
  'Alex','Caio','Murilo','Otávio','Wesley','Ricardo','Sérgio','Fábio','Léo','Anderson',
  'Bernardo','Davi','Enzo','Fernando','Guilherme','Hugo','Iago','Joaquim','Kauã','Luiz',
  'Nícolas','Vitor','Yuri','Adriano','Cláudio','Emerson','Filipe','Gustavo','Hélio','Ismael',
];

const LAST_NAMES = [
  'Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento',
  'Lima','Araújo','Fernandes','Carvalho','Gomes','Martins','Rocha','Ribeiro','Alves',
  'Monteiro','Mendes','Barbosa','Cavalcanti','Dias','Freitas','Andrade','Cardoso','Teixeira',
  'Moraes','Pinto','Castro','Ramos','Tavares','Vieira','Xavier','Moreira','Borges','Campos',
  'Macedo','Pacheco','Sales','Queiroz','Reis','Siqueira','Torres','Vasconcelos',
];

// Formações: contagem por papel + multiplicadores ofensivo/defensivo + slots
// posicionais na visualização do campo (x,y em 0..100).
const FORMATIONS = {
  '4-4-2': {
    counts: { GK: 1, DEF: 4, MID: 4, ATT: 2 },
    defMod: 1.00, attMod: 1.00,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 15, y: 72 }, { role: 'DEF', x: 38, y: 75 }, { role: 'DEF', x: 62, y: 75 }, { role: 'DEF', x: 85, y: 72 },
      { role: 'MID', x: 18, y: 48 }, { role: 'MID', x: 40, y: 50 }, { role: 'MID', x: 60, y: 50 }, { role: 'MID', x: 82, y: 48 },
      { role: 'ATT', x: 38, y: 22 }, { role: 'ATT', x: 62, y: 22 },
    ],
  },
  '4-3-3': {
    counts: { GK: 1, DEF: 4, MID: 3, ATT: 3 },
    defMod: 0.96, attMod: 1.08,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 15, y: 72 }, { role: 'DEF', x: 38, y: 75 }, { role: 'DEF', x: 62, y: 75 }, { role: 'DEF', x: 85, y: 72 },
      { role: 'MID', x: 30, y: 50 }, { role: 'MID', x: 50, y: 55 }, { role: 'MID', x: 70, y: 50 },
      { role: 'ATT', x: 20, y: 22 }, { role: 'ATT', x: 50, y: 18 }, { role: 'ATT', x: 80, y: 22 },
    ],
  },
  '4-5-1': {
    counts: { GK: 1, DEF: 4, MID: 5, ATT: 1 },
    defMod: 1.04, attMod: 0.92,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 15, y: 72 }, { role: 'DEF', x: 38, y: 75 }, { role: 'DEF', x: 62, y: 75 }, { role: 'DEF', x: 85, y: 72 },
      { role: 'MID', x: 15, y: 50 }, { role: 'MID', x: 33, y: 53 }, { role: 'MID', x: 50, y: 50 }, { role: 'MID', x: 67, y: 53 }, { role: 'MID', x: 85, y: 50 },
      { role: 'ATT', x: 50, y: 20 },
    ],
  },
  '3-5-2': {
    counts: { GK: 1, DEF: 3, MID: 5, ATT: 2 },
    defMod: 0.92, attMod: 1.06,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 25, y: 72 }, { role: 'DEF', x: 50, y: 75 }, { role: 'DEF', x: 75, y: 72 },
      { role: 'MID', x: 12, y: 50 }, { role: 'MID', x: 33, y: 53 }, { role: 'MID', x: 50, y: 50 }, { role: 'MID', x: 67, y: 53 }, { role: 'MID', x: 88, y: 50 },
      { role: 'ATT', x: 38, y: 22 }, { role: 'ATT', x: 62, y: 22 },
    ],
  },
  '5-3-2': {
    counts: { GK: 1, DEF: 5, MID: 3, ATT: 2 },
    defMod: 1.12, attMod: 0.92,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 12, y: 70 }, { role: 'DEF', x: 32, y: 75 }, { role: 'DEF', x: 50, y: 78 }, { role: 'DEF', x: 68, y: 75 }, { role: 'DEF', x: 88, y: 70 },
      { role: 'MID', x: 30, y: 50 }, { role: 'MID', x: 50, y: 53 }, { role: 'MID', x: 70, y: 50 },
      { role: 'ATT', x: 38, y: 22 }, { role: 'ATT', x: 62, y: 22 },
    ],
  },
  '5-4-1': {
    counts: { GK: 1, DEF: 5, MID: 4, ATT: 1 },
    defMod: 1.16, attMod: 0.85,
    slots: [
      { role: 'GK',  x: 50, y: 92 },
      { role: 'DEF', x: 12, y: 70 }, { role: 'DEF', x: 32, y: 75 }, { role: 'DEF', x: 50, y: 78 }, { role: 'DEF', x: 68, y: 75 }, { role: 'DEF', x: 88, y: 70 },
      { role: 'MID', x: 18, y: 50 }, { role: 'MID', x: 40, y: 53 }, { role: 'MID', x: 60, y: 53 }, { role: 'MID', x: 82, y: 50 },
      { role: 'ATT', x: 50, y: 20 },
    ],
  },
};

const FORMATION_NAMES = Object.keys(FORMATIONS);

// Default squad shape: 1+1 GK, 4+2 DEF, 4+2 MID, 2+2 ATT = 18 jogadores.
const SQUAD_PLAN = [
  { role: 'GK',  count: 2 },
  { role: 'DEF', count: 6 },
  { role: 'MID', count: 6 },
  { role: 'ATT', count: 4 },
];

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function makeAttrs(rng, role, reputation, age) {
  // Jogadores muito jovens começam abaixo do potencial.
  const youthPenalty = age <= 19 ? -8 : age <= 21 ? -4 : 0;
  const base = clamp(reputation + rngInt(rng, -14, 10) + youthPenalty, 30, 95);
  const focus = (lo, hi) => clamp(base + rngInt(rng, lo, hi), 25, 99);
  switch (role) {
    case 'GK':  return { GK: focus(0, 6),  DEF: focus(-25, -10), PASS: focus(-25, -10), TEC: focus(-25, -10), ATK: focus(-30, -20) };
    case 'DEF': return { GK: focus(-30, -20), DEF: focus(0, 6),  PASS: focus(-10, 2),   TEC: focus(-15, 0),   ATK: focus(-25, -10) };
    case 'MID': return { GK: focus(-30, -20), DEF: focus(-10, 2), PASS: focus(0, 6),    TEC: focus(-2, 6),    ATK: focus(-12, 2) };
    case 'ATT': return { GK: focus(-30, -20), DEF: focus(-20, -5), PASS: focus(-8, 4),  TEC: focus(-2, 6),    ATK: focus(0, 8) };
  }
}

function overall(player) {
  const a = player.attrs;
  switch (player.role) {
    case 'GK':  return Math.round(a.GK * 0.85 + a.DEF * 0.15);
    case 'DEF': return Math.round(a.DEF * 0.65 + a.PASS * 0.2 + a.TEC * 0.15);
    case 'MID': return Math.round(a.PASS * 0.35 + a.TEC * 0.3 + a.DEF * 0.2 + a.ATK * 0.15);
    case 'ATT': return Math.round(a.ATK * 0.5 + a.TEC * 0.3 + a.PASS * 0.2);
  }
}

function estimateValue(p) {
  const ratingFactor = Math.pow(Math.max(1, p.rating - 40) / 10, 2.3);
  const peak = p.age <= 27 ? 1 : Math.max(0.25, 1 - (p.age - 27) * 0.12);
  const youth = p.age <= 22 ? 1.15 : 1.0;
  return Math.round(ratingFactor * 150_000 * peak * youth / 10_000) * 10_000;
}

function emptyStatus() { return { yellow: 0, injured: 0, suspended: 0 }; }

function generatePlayer(rng, team, role, index, age = null) {
  const first = pick(rng, FIRST_NAMES);
  const last = pick(rng, LAST_NAMES);
  const a = age == null ? rngInt(rng, 17, 35) : age;
  const attrs = makeAttrs(rng, role, team.reputation, a);
  const id = `${team.id}-p${index}-${(rng()*1e9)|0}`;
  const player = { id, name: `${first} ${last}`, age: a, role, attrs, teamId: team.id, transferListed: false, status: emptyStatus() };
  player.rating = overall(player);
  player.value = estimateValue(player);
  return player;
}

function generateSquad(team) {
  const rng = mulberry32(hashString('squad:' + team.id));
  const players = [];
  let idx = 0;
  for (const slot of SQUAD_PLAN) {
    for (let i = 0; i < slot.count; i++) {
      players.push(generatePlayer(rng, team, slot.role, idx++));
    }
  }
  return players;
}

function buildLeague() {
  const teams = TEAMS.map(t => ({ ...t, squad: generateSquad(t), formation: '4-4-2', lineup: null }));
  return teams;
}

function buildFixtures(teamIds) {
  const ids = teamIds.slice();
  if (ids.length % 2 === 1) ids.push(null);
  const n = ids.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const home = ids[i];
      const away = ids[n - 1 - i];
      if (home && away) round.push({ home, away });
    }
    rounds.push(round);
    ids.splice(1, 0, ids.pop());
  }
  const returnLeg = rounds.map(round => round.map(m => ({ home: m.away, away: m.home })));
  return rounds.concat(returnLeg);
}

// SVG do escudo do clube. Forma de escudo + iniciais grandes.
function crestSVG(team, size = 40) {
  const { primary, secondary } = team.colors;
  return `<svg viewBox="0 0 100 120" width="${size}" height="${(size * 1.2).toFixed(0)}" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8 L92 8 L92 68 Q92 102 50 116 Q8 102 8 68 Z" fill="${primary}" stroke="${secondary}" stroke-width="4"/>
    <path d="M8 35 L92 35" stroke="${secondary}" stroke-width="2" opacity="0.5"/>
    <text x="50" y="78" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="900" font-size="${team.short.length >= 3 ? 30 : 38}" fill="${secondary}">${team.short}</text>
  </svg>`;
}

// Envelhece um jogador uma temporada. Mexe nos atributos conforme a curva
// de idade e renova valor/rating. Retorna true se deve se aposentar.
function agePlayer(player, rng) {
  player.age++;
  player.status = emptyStatus();
  const a = player.attrs;
  let delta = 0;
  if (player.age <= 22) delta = 2 + Math.floor(rng() * 3); // crescimento
  else if (player.age <= 26) delta = rng() < 0.5 ? 0 : 1;   // estabilização
  else if (player.age <= 30) delta = rng() < 0.3 ? -1 : 0;  // platô
  else if (player.age <= 34) delta = -1 - Math.floor(rng() * 2); // declínio
  else delta = -2 - Math.floor(rng() * 3); // declínio acentuado
  for (const k of ['GK','DEF','PASS','TEC','ATK']) {
    a[k] = clamp(a[k] + delta + Math.floor((rng() - 0.5) * 4), 20, 99);
  }
  player.rating = overall(player);
  player.value = estimateValue(player);
  return player.age >= 37 || player.rating < 38;
}

function regenerateSquad(team, rng) {
  // Garante que o time tenha pelo menos os mínimos por posição. Repõe com jovens.
  const byRole = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of team.squad) byRole[p.role].push(p);
  for (const slot of SQUAD_PLAN) {
    while (byRole[slot.role].length < slot.count) {
      const idx = team.squad.length + byRole[slot.role].length;
      const youth = generatePlayer(rng, team, slot.role, idx, rngInt(rng, 17, 19));
      team.squad.push(youth);
      byRole[slot.role].push(youth);
    }
  }
}

window.CMData = {
  TEAMS, FORMATIONS, FORMATION_NAMES, buildLeague, buildFixtures, overall, estimateValue,
  mulberry32, hashString, rngInt, pick, clamp,
  crestSVG, agePlayer, regenerateSquad, generatePlayer, emptyStatus,
};
