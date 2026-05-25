// Temporada: tabela de classificação e avanço de rodadas.

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

window.CMSeason = { emptyTable, applyResult, sortedTable };
