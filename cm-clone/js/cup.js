// Copa eliminatória. 8 clubes classificados, 3 fases (Quartas/Semi/Final).
// Cada confronto é jogo único; em caso de empate vai para pênaltis aleatórios.

const CUP_STAGES = ['QF', 'SF', 'F'];
const STAGE_NAMES = { QF: 'Quartas de final', SF: 'Semifinal', F: 'Final' };
const STAGE_AFTER_ROUND = { QF: 6, SF: 12, F: 18 }; // rodada da liga após a qual a fase acontece

function pickQualifiers(teams, lastTablePositions) {
  if (lastTablePositions && lastTablePositions.length >= 8) {
    return lastTablePositions.slice(0, 8);
  }
  return teams.slice().sort((a, b) => b.reputation - a.reputation).slice(0, 8).map(t => t.id);
}

function initCup(teams, qualifierIds, seed) {
  const rng = CMData.mulberry32(seed);
  const shuffled = qualifierIds.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const qfMatches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    qfMatches.push({ home: shuffled[i], away: shuffled[i + 1], result: null });
  }
  return {
    qualified: qualifierIds.slice(),
    rounds: [
      { stage: 'QF', matches: qfMatches },
      { stage: 'SF', matches: [] },
      { stage: 'F',  matches: [] },
    ],
    champion: null,
    stageIndex: 0,
  };
}

function stageDueAfterRound(round) {
  for (const stage of CUP_STAGES) {
    if (STAGE_AFTER_ROUND[stage] === round) return stage;
  }
  return null;
}

function stageMatches(cup, stage) {
  const r = cup.rounds.find(x => x.stage === stage);
  return r ? r.matches : [];
}

function getUserCupMatch(cup, stage, userTeamId) {
  const ms = stageMatches(cup, stage);
  return ms.find(m => m.home === userTeamId || m.away === userTeamId) || null;
}

// Simula todas partidas da fase (exceto a do usuário se userMatchResult vier
// já calculado). Atualiza brackets. Retorna lista de resultados.
function playCupStage(state, stage, userMatchResult, seed) {
  const cup = state.cup;
  const matches = stageMatches(cup, stage);
  const teamMap = Object.fromEntries(state.teams.map(t => [t.id, t]));
  const winners = [];
  for (const m of matches) {
    if (userMatchResult && m === userMatchResult.match) {
      m.result = userMatchResult.result;
      winners.push(decideWinner(m));
      continue;
    }
    const home = teamMap[m.home];
    const away = teamMap[m.away];
    const matchSeed = CMData.hashString(`cup:${state.season}:${stage}:${m.home}:${m.away}:${seed}`);
    const res = CMEngine.simulateMatch(home, away, matchSeed);
    m.result = res;
    winners.push(decideWinner(m));
  }
  // Construir próxima fase.
  const idx = CUP_STAGES.indexOf(stage);
  if (idx < CUP_STAGES.length - 1) {
    const next = cup.rounds[idx + 1];
    next.matches = [];
    for (let i = 0; i < winners.length; i += 2) {
      const a = winners[i];
      const b = winners[i + 1];
      if (a && b) next.matches.push({ home: a, away: b, result: null });
    }
  } else {
    cup.champion = winners[0];
  }
  cup.stageIndex = idx + 1;
}

function decideWinner(match) {
  const r = match.result;
  if (!r) return null;
  if (r.homeGoals > r.awayGoals) return match.home;
  if (r.awayGoals > r.homeGoals) return match.away;
  // Empate → pênaltis aleatórios (50/50).
  const rng = CMData.mulberry32(CMData.hashString(`pen:${match.home}:${match.away}:${r.homeGoals}`));
  return rng() < 0.5 ? match.home : match.away;
}

function isUserStillIn(cup, userTeamId, currentStage) {
  const idx = CUP_STAGES.indexOf(currentStage);
  if (idx < 0) return false;
  const round = cup.rounds[idx];
  return round.matches.some(m => m.home === userTeamId || m.away === userTeamId);
}

window.CMCup = {
  CUP_STAGES, STAGE_NAMES, STAGE_AFTER_ROUND,
  pickQualifiers, initCup, stageDueAfterRound, stageMatches,
  getUserCupMatch, playCupStage, decideWinner, isUserStillIn,
};
