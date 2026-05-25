// Motor de simulação de partida. Avança 90 "ticks" (minutos). Em cada minuto,
// calcula a chance de uma chegada de cada lado proporcional ao seu ataque vs.
// defesa do adversário. Chegadas geram chutes; chutes podem virar gol.

function pickStarting(squad) {
  const byRole = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const p of squad) byRole[p.role].push(p);
  for (const r of Object.keys(byRole)) byRole[r].sort((a, b) => b.rating - a.rating);
  const starters = [
    ...byRole.GK.slice(0, 1),
    ...byRole.DEF.slice(0, 4),
    ...byRole.MID.slice(0, 4),
    ...byRole.ATT.slice(0, 2),
  ];
  return starters;
}

function teamStrength(starters) {
  const gk = starters.find(p => p.role === 'GK');
  const def = starters.filter(p => p.role === 'DEF');
  const mid = starters.filter(p => p.role === 'MID');
  const att = starters.filter(p => p.role === 'ATT');
  const avg = arr => arr.reduce((s, p) => s + p.rating, 0) / Math.max(1, arr.length);
  return {
    keeper: gk ? gk.attrs.GK : 50,
    defense: avg(def) * 0.75 + avg(mid) * 0.25,
    attack: avg(att) * 0.7 + avg(mid) * 0.3,
    starters,
  };
}

function weightedPick(rng, items, weightFn) {
  const total = items.reduce((s, it) => s + weightFn(it), 0);
  let r = rng() * total;
  for (const it of items) {
    r -= weightFn(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function simulateMatch(homeTeam, awayTeam, seed) {
  const rng = CMData.mulberry32(seed);
  const homeXI = pickStarting(homeTeam.squad);
  const awayXI = pickStarting(awayTeam.squad);
  const H = teamStrength(homeXI);
  const A = teamStrength(awayXI);

  const homePush = 1.08; // vantagem em casa
  const homeChanceRate = (H.attack * homePush) / (H.attack * homePush + A.defense) * 0.13;
  const awayChanceRate = A.attack / (A.attack + H.defense * homePush) * 0.11;

  const events = [];
  let homeGoals = 0, awayGoals = 0;
  const homeScorers = [], awayScorers = [];
  const attackers = side => side.starters.filter(p => p.role !== 'GK' && p.role !== 'DEF').concat(side.starters.filter(p => p.role === 'DEF'));

  for (let minute = 1; minute <= 90; minute++) {
    if (rng() < homeChanceRate) {
      const goalChance = (H.attack / 100) * (1 - A.keeper / 130);
      if (rng() < goalChance) {
        const scorer = weightedPick(rng, attackers(H), p => p.attrs.ATK + (p.role === 'ATT' ? 30 : p.role === 'MID' ? 15 : 0));
        homeGoals++;
        homeScorers.push(scorer);
        events.push({ minute, side: 'home', type: 'goal', text: `${minute}' ⚽ GOL do ${homeTeam.short}! ${scorer.name} balança a rede. (${homeGoals}-${awayGoals})` });
      } else if (rng() < 0.4) {
        const shooter = weightedPick(rng, attackers(H), p => p.attrs.ATK + 5);
        events.push({ minute, side: 'home', type: 'shot', text: `${minute}' ${homeTeam.short} chega com perigo, ${shooter.name} finaliza mas o goleiro defende.` });
      }
    }
    if (rng() < awayChanceRate) {
      const goalChance = (A.attack / 100) * (1 - H.keeper / 130);
      if (rng() < goalChance) {
        const scorer = weightedPick(rng, attackers(A), p => p.attrs.ATK + (p.role === 'ATT' ? 30 : p.role === 'MID' ? 15 : 0));
        awayGoals++;
        awayScorers.push(scorer);
        events.push({ minute, side: 'away', type: 'goal', text: `${minute}' ⚽ GOL do ${awayTeam.short}! ${scorer.name} marca fora de casa. (${homeGoals}-${awayGoals})` });
      } else if (rng() < 0.35) {
        const shooter = weightedPick(rng, attackers(A), p => p.attrs.ATK + 5);
        events.push({ minute, side: 'away', type: 'shot', text: `${minute}' ${awayTeam.short} responde, ${shooter.name} arrisca mas para na zaga.` });
      }
    }
    if (minute === 45) events.push({ minute: 45, side: null, type: 'half', text: `Intervalo. ${homeTeam.short} ${homeGoals} x ${awayGoals} ${awayTeam.short}` });
  }

  events.push({
    minute: 90, side: null, type: 'final',
    text: `Fim de jogo. ${homeTeam.short} ${homeGoals} x ${awayGoals} ${awayTeam.short}`,
  });

  return {
    home: homeTeam.id, away: awayTeam.id,
    homeGoals, awayGoals,
    homeScorers: homeScorers.map(p => p.id),
    awayScorers: awayScorers.map(p => p.id),
    events,
  };
}

window.CMEngine = { simulateMatch, pickStarting };
