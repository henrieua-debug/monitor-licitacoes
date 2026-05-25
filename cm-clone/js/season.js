// Temporada: tabela, decremento de status, e renovação de elenco entre temporadas.

function emptyTable(teams) {
  const table = {};
  for (const t of teams) {
    table[t.id] = { teamId: t.id, P: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, Pts: 0 };
  }
  return table;
}

function applyResult(table, result) {
  const h = table[result.home];
  const a = table[result.away];
  h.P++; a.P++;
  h.GP += result.homeGoals; h.GC += result.awayGoals;
  a.GP += result.awayGoals; a.GC += result.homeGoals;
  if (result.homeGoals > result.awayGoals) { h.V++; h.Pts += 3; a.D++; }
  else if (result.homeGoals < result.awayGoals) { a.V++; a.Pts += 3; h.D++; }
  else { h.E++; a.E++; h.Pts++; a.Pts++; }
}

function sortedTable(table, teamMap) {
  return Object.values(table).map(row => ({
    ...row,
    SG: row.GP - row.GC,
    team: teamMap[row.teamId],
  })).sort((a, b) => b.Pts - a.Pts || b.SG - a.SG || b.GP - a.GP || a.team.name.localeCompare(b.team.name));
}

// Aplica efeitos colaterais de uma partida ao estado: lesões e suspensões.
function applySideEffects(state, sideEffects) {
  if (!sideEffects) return;
  for (const t of state.teams) {
    for (const p of t.squad) {
      for (const inj of sideEffects.injuries) {
        if (p.id === inj.playerId) p.status.injured = inj.weeks;
      }
      for (const r of sideEffects.reds) {
        if (p.id === r) p.status.suspended = 1;
      }
    }
  }
}

// Decrementa status (lesões/suspensões) ao avançar uma rodada.
function tickStatuses(teams) {
  for (const t of teams) {
    for (const p of t.squad) {
      if (p.status.injured > 0) p.status.injured--;
      if (p.status.suspended > 0) p.status.suspended--;
    }
  }
}

// Encerra a temporada: envelhece, aposenta os velhos/fracos e gera juniores.
// Retorna { retired: [{teamId, playerName}] }.
function endOfSeason(state) {
  const retired = [];
  const rng = CMData.mulberry32(CMData.hashString('eos:' + state.season));
  for (const team of state.teams) {
    const survivors = [];
    for (const p of team.squad) {
      const willRetire = CMData.agePlayer(p, rng);
      if (willRetire) {
        retired.push({ teamId: team.id, name: p.name, age: p.age, role: p.role });
      } else {
        p.status = CMData.emptyStatus();
        p.transferListed = false;
        survivors.push(p);
      }
    }
    team.squad = survivors;
    CMData.regenerateSquad(team, rng);
  }
  return { retired };
}

window.CMSeason = { emptyTable, applyResult, sortedTable, applySideEffects, tickStatuses, endOfSeason };
