// Dataset fictício. Times, jogadores e nomes são inventados para evitar
// qualquer dependência de bases de jogos comerciais.

const TEAMS = [
  { id: 't1',  name: 'Atlético Solar',    short: 'ATS', city: 'São Paulo',      reputation: 82 },
  { id: 't2',  name: 'União Paulista',    short: 'UNP', city: 'Campinas',       reputation: 74 },
  { id: 't3',  name: 'Real Litoral',      short: 'RLT', city: 'Santos',         reputation: 70 },
  { id: 't4',  name: 'Esporte Andorinha', short: 'AND', city: 'Belo Horizonte', reputation: 68 },
  { id: 't5',  name: 'Cruz do Sul',       short: 'CDS', city: 'Porto Alegre',   reputation: 78 },
  { id: 't6',  name: 'Pacífico FC',       short: 'PAC', city: 'Recife',         reputation: 62 },
  { id: 't7',  name: 'Verde Vale',        short: 'VVL', city: 'Curitiba',       reputation: 66 },
  { id: 't8',  name: 'Boreal United',     short: 'BRU', city: 'Manaus',         reputation: 58 },
  { id: 't9',  name: 'Estrela Náutica',   short: 'EST', city: 'Florianópolis',  reputation: 64 },
  { id: 't10', name: 'Centauro FC',       short: 'CTR', city: 'Goiânia',        reputation: 72 },
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

const FORMATION = [
  { role: 'GK',  count: 1, reserves: 1 },
  { role: 'DEF', count: 4, reserves: 2 },
  { role: 'MID', count: 4, reserves: 1 },
  { role: 'ATT', count: 2, reserves: 1 },
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

function rngInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// Gera atributos para um jogador baseado em posição e reputação do clube.
function makeAttrs(rng, role, reputation) {
  const base = clamp(reputation + rngInt(rng, -14, 10), 30, 95);
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

function generatePlayer(rng, team, role, index) {
  const first = pick(rng, FIRST_NAMES);
  const last = pick(rng, LAST_NAMES);
  const age = rngInt(rng, 17, 35);
  const attrs = makeAttrs(rng, role, team.reputation);
  const id = `${team.id}-p${index}`;
  const player = { id, name: `${first} ${last}`, age, role, attrs, teamId: team.id, transferListed: false };
  player.rating = overall(player);
  player.value = estimateValue(player);
  return player;
}

function estimateValue(p) {
  const ratingFactor = Math.pow(Math.max(1, p.rating - 40) / 10, 2.3);
  const peak = p.age <= 27 ? 1 : Math.max(0.25, 1 - (p.age - 27) * 0.12);
  return Math.round(ratingFactor * 150_000 * peak / 10_000) * 10_000;
}

function generateSquad(team) {
  const rng = mulberry32(hashString('squad:' + team.id));
  const players = [];
  let idx = 0;
  for (const slot of FORMATION) {
    const total = slot.count + slot.reserves;
    for (let i = 0; i < total; i++) {
      players.push(generatePlayer(rng, team, slot.role, idx++));
    }
  }
  return players;
}

// Constrói a liga inteira: times com elencos completos.
function buildLeague() {
  const teams = TEAMS.map(t => ({ ...t, squad: generateSquad(t) }));
  return teams;
}

// Calendário round-robin de turno e returno.
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
  const returnLeg = rounds.map(round =>
    round.map(m => ({ home: m.away, away: m.home }))
  );
  return rounds.concat(returnLeg);
}

window.CMData = {
  TEAMS, FORMATION, buildLeague, buildFixtures, overall, estimateValue,
  mulberry32, hashString, rngInt, pick,
};
