// Mercado de transferências simples. Cada clube da IA lista alguns jogadores
// substituíveis (geralmente reservas ou em final de carreira). O usuário pode
// fazer ofertas; a IA aceita se a oferta cobre o valor de mercado.

function refreshTransferList(teams, userTeamId, seed) {
  const rng = CMData.mulberry32(seed);
  for (const team of teams) {
    for (const p of team.squad) p.transferListed = false;
    if (team.id === userTeamId) continue;
    const byRole = { GK: [], DEF: [], MID: [], ATT: [] };
    for (const p of team.squad) byRole[p.role].push(p);
    for (const role of Object.keys(byRole)) {
      byRole[role].sort((a, b) => a.rating - b.rating);
      const minKeep = role === 'GK' ? 1 : role === 'ATT' ? 2 : 3;
      const surplus = byRole[role].slice(0, Math.max(0, byRole[role].length - minKeep));
      for (const p of surplus) {
        if (rng() < 0.5 || p.age >= 32) p.transferListed = true;
      }
    }
  }
}

function listAvailable(teams, userTeamId) {
  const out = [];
  for (const team of teams) {
    if (team.id === userTeamId) continue;
    for (const p of team.squad) {
      if (p.transferListed) out.push(p);
    }
  }
  return out.sort((a, b) => b.rating - a.rating);
}

// Tenta uma oferta. Retorna { accepted, message, deal? }.
function makeOffer(state, playerId, amount) {
  const player = findPlayer(state.teams, playerId);
  if (!player) return { accepted: false, message: 'Jogador não encontrado.' };
  if (player.teamId === state.userTeamId) return { accepted: false, message: 'Jogador já é seu.' };
  if (!player.transferListed) return { accepted: false, message: 'Não está na lista de transferíveis.' };
  if (amount > state.budget) return { accepted: false, message: 'Saldo insuficiente.' };
  const askingPrice = Math.round(player.value * 1.1);
  if (amount < askingPrice) {
    return { accepted: false, message: `Oferta recusada. O clube pede ao menos R$ ${formatMoney(askingPrice)}.` };
  }
  const seller = state.teams.find(t => t.id === player.teamId);
  const buyer = state.teams.find(t => t.id === state.userTeamId);
  seller.squad = seller.squad.filter(p => p.id !== player.id);
  player.teamId = buyer.id;
  player.transferListed = false;
  buyer.squad.push(player);
  state.budget -= amount;
  return {
    accepted: true,
    message: `${player.name} contratado por R$ ${formatMoney(amount)}.`,
    deal: { playerId: player.id, from: seller.id, to: buyer.id, fee: amount },
  };
}

function listOwnPlayer(state, playerId, list) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const p = team.squad.find(x => x.id === playerId);
  if (!p) return;
  p.transferListed = !!list;
}

function processOutgoingOffers(state, seed) {
  const rng = CMData.mulberry32(seed);
  const team = state.teams.find(t => t.id === state.userTeamId);
  const events = [];
  for (const p of team.squad.filter(p => p.transferListed)) {
    if (rng() > 0.35) continue;
    const offerPct = 0.85 + rng() * 0.4;
    const offer = Math.round(p.value * offerPct);
    const interested = state.teams.filter(t => t.id !== team.id);
    const buyer = CMData.pick(rng, interested);
    events.push({
      type: 'incoming_offer',
      player: p,
      buyer,
      offer,
    });
  }
  return events;
}

function acceptOffer(state, offerEvent) {
  const { player, buyer, offer } = offerEvent;
  const sellerTeam = state.teams.find(t => t.id === state.userTeamId);
  sellerTeam.squad = sellerTeam.squad.filter(x => x.id !== player.id);
  player.teamId = buyer.id;
  player.transferListed = false;
  buyer.squad.push(player);
  state.budget += offer;
  return `${player.name} vendido ao ${buyer.short} por R$ ${formatMoney(offer)}.`;
}

function findPlayer(teams, playerId) {
  for (const t of teams) {
    const p = t.squad.find(x => x.id === playerId);
    if (p) return p;
  }
  return null;
}

function formatMoney(n) {
  return n.toLocaleString('pt-BR');
}

window.CMTransfers = {
  refreshTransferList, listAvailable, makeOffer, listOwnPlayer,
  processOutgoingOffers, acceptOffer, findPlayer, formatMoney,
};
