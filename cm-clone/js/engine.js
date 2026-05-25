// Motor de simulação de partida. Avança 90 ticks. Considera formação,
// disponibilidade (lesões/suspensões), e gera eventos de cartão e lesão.

function isAvailable(p) { return p.status.injured === 0 && p.status.suspended === 0; }

// Escolhe XI titular. Respeita formação e lineup pré-selecionado pelo usuário.
// Slots com jogador indisponível ou sem escolha são preenchidos pelo melhor
// substituto disponível para aquela posição.
function pickStartingXI(team, formationKey, forcedLineup) {
  const formation = CMData.FORMATIONS[formationKey] || CMData.FORMATIONS['4-4-2'];
  const slots = formation.slots;
  const available = team.squad.filter(isAvailable);
  const usedIds = new Set();
  const xi = new Array(slots.length).fill(null);

  // Primeiro, honra escolhas válidas do lineup forçado.
  if (forcedLineup) {
    for (let i = 0; i < slots.length; i++) {
      const pid = forcedLineup[i];
      if (!pid) continue;
      const p = available.find(x => x.id === pid && !usedIds.has(x.id));
      if (p && p.role === slots[i].role) {
        xi[i] = p;
        usedIds.add(p.id);
      }
    }
  }

  // Preenche slots vazios com o melhor jogador da posição certa.
  for (let i = 0; i < slots.length; i++) {
    if (xi[i]) continue;
    const candidates = available
      .filter(p => p.role === slots[i].role && !usedIds.has(p.id))
      .sort((a, b) => b.rating - a.rating);
    if (candidates.length) {
      xi[i] = candidates[0];
      usedIds.add(candidates[0].id);
    }
  }

  // Se ainda faltam (squad muito desfalcado), usa qualquer disponível.
  for (let i = 0; i < slots.length; i++) {
    if (xi[i]) continue;
    const fallback = available.filter(p => !usedIds.has(p.id)).sort((a, b) => b.rating - a.rating)[0];
    if (fallback) { xi[i] = fallback; usedIds.add(fallback.id); }
  }

  return { xi: xi.filter(Boolean), formation, slots };
}

function teamStrength(xi, formation) {
  const gk = xi.find(p => p.role === 'GK');
  const def = xi.filter(p => p.role === 'DEF');
  const mid = xi.filter(p => p.role === 'MID');
  const att = xi.filter(p => p.role === 'ATT');
  const avg = arr => arr.length ? arr.reduce((s, p) => s + p.rating, 0) / arr.length : 50;
  return {
    keeper: gk ? gk.attrs.GK : 45,
    defense: (avg(def) * 0.7 + avg(mid) * 0.3) * formation.defMod,
    attack: (avg(att) * 0.65 + avg(mid) * 0.35) * formation.attMod,
    xi,
  };
}

function weightedPick(rng, items, weightFn) {
  const total = items.reduce((s, it) => s + weightFn(it), 0);
  if (total <= 0) return items[0];
  let r = rng() * total;
  for (const it of items) {
    r -= weightFn(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function simulateMatch(homeTeam, awayTeam, seed, opts = {}) {
  const rng = CMData.mulberry32(seed);

  const homePick = pickStartingXI(homeTeam, homeTeam.formation, opts.homeLineup);
  const awayPick = pickStartingXI(awayTeam, awayTeam.formation, opts.awayLineup);
  const H = teamStrength(homePick.xi, homePick.formation);
  const A = teamStrength(awayPick.xi, awayPick.formation);

  // Times com jogadores na partida (mutáveis ao longo do jogo por expulsão).
  let onPitchHome = homePick.xi.slice();
  let onPitchAway = awayPick.xi.slice();

  const homePush = 1.08;
  let homeChanceRate = (H.attack * homePush) / (H.attack * homePush + A.defense) * 0.13;
  let awayChanceRate = A.attack / (A.attack + H.defense * homePush) * 0.11;

  const events = [];
  let homeGoals = 0, awayGoals = 0;
  const yellowMap = new Map(); // playerId -> count in this match
  const sideEffects = { injuries: [], cards: [], reds: [] };

  const attackers = list => list.filter(p => p.role !== 'GK' && p.role !== 'DEF')
    .concat(list.filter(p => p.role === 'DEF'));

  function applyRedCard(side, player) {
    sideEffects.reds.push(player.id);
    sideEffects.cards.push({ playerId: player.id, type: 'red' });
    if (side === 'home') {
      onPitchHome = onPitchHome.filter(p => p.id !== player.id);
      homeChanceRate *= 0.78;
      awayChanceRate *= 1.18;
    } else {
      onPitchAway = onPitchAway.filter(p => p.id !== player.id);
      awayChanceRate *= 0.78;
      homeChanceRate *= 1.18;
    }
  }

  function tryDiscipline(side, label, list) {
    if (rng() < 0.018) {
      const player = CMData.pick(rng, list.filter(p => p.role !== 'GK'));
      if (!player) return;
      const current = (yellowMap.get(player.id) || 0) + 1;
      yellowMap.set(player.id, current);
      if (current >= 2) {
        applyRedCard(side, player);
        events.push({ minute: events._m, side, type: 'red', text: `${events._m}' 🟥 ${label}: ${player.name} recebe o segundo amarelo e está expulso.` });
      } else {
        sideEffects.cards.push({ playerId: player.id, type: 'yellow' });
        events.push({ minute: events._m, side, type: 'yellow', text: `${events._m}' 🟨 ${label}: ${player.name} recebe cartão amarelo.` });
      }
    } else if (rng() < 0.0028) {
      const player = CMData.pick(rng, list.filter(p => p.role !== 'GK'));
      if (player) {
        applyRedCard(side, player);
        events.push({ minute: events._m, side, type: 'red', text: `${events._m}' 🟥 ${label}: ${player.name} é expulso direto.` });
      }
    }
  }

  function tryInjury(side, label, list) {
    if (rng() < 0.0022) {
      const player = CMData.pick(rng, list);
      if (!player) return;
      const weeks = CMData.rngInt(rng, 1, 5);
      sideEffects.injuries.push({ playerId: player.id, weeks });
      if (side === 'home') onPitchHome = onPitchHome.filter(p => p.id !== player.id);
      else onPitchAway = onPitchAway.filter(p => p.id !== player.id);
      events.push({ minute: events._m, side, type: 'injury', text: `${events._m}' 🩹 ${label}: ${player.name} sai lesionado (${weeks} rodada${weeks > 1 ? 's' : ''}).` });
    }
  }

  for (let minute = 1; minute <= 90; minute++) {
    events._m = minute;

    tryDiscipline('home', homeTeam.short, onPitchHome);
    tryDiscipline('away', awayTeam.short, onPitchAway);
    tryInjury('home', homeTeam.short, onPitchHome);
    tryInjury('away', awayTeam.short, onPitchAway);

    if (rng() < homeChanceRate && onPitchHome.length) {
      const goalChance = (H.attack / 100) * (1 - A.keeper / 130);
      if (rng() < goalChance) {
        const scorer = weightedPick(rng, attackers(onPitchHome), p => p.attrs.ATK + (p.role === 'ATT' ? 30 : p.role === 'MID' ? 15 : 0));
        homeGoals++;
        events.push({ minute, side: 'home', type: 'goal', text: `${minute}' ⚽ GOL do ${homeTeam.short}! ${scorer.name} balança a rede. (${homeGoals}-${awayGoals})` });
      } else if (rng() < 0.4) {
        const shooter = weightedPick(rng, attackers(onPitchHome), p => p.attrs.ATK + 5);
        events.push({ minute, side: 'home', type: 'shot', text: `${minute}' ${homeTeam.short} chega com perigo, ${shooter.name} finaliza mas o goleiro defende.` });
      }
    }
    if (rng() < awayChanceRate && onPitchAway.length) {
      const goalChance = (A.attack / 100) * (1 - H.keeper / 130);
      if (rng() < goalChance) {
        const scorer = weightedPick(rng, attackers(onPitchAway), p => p.attrs.ATK + (p.role === 'ATT' ? 30 : p.role === 'MID' ? 15 : 0));
        awayGoals++;
        events.push({ minute, side: 'away', type: 'goal', text: `${minute}' ⚽ GOL do ${awayTeam.short}! ${scorer.name} marca fora de casa. (${homeGoals}-${awayGoals})` });
      } else if (rng() < 0.35) {
        const shooter = weightedPick(rng, attackers(onPitchAway), p => p.attrs.ATK + 5);
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
    sideEffects,
    events,
  };
}

window.CMEngine = { simulateMatch, pickStartingXI, isAvailable };
