export interface RaffleWinnerUser {
  id: string;
  name: string | null;
  steamId: string | null;
  avatar: string | null;
  tradeUrl?: string | null;
}

export interface RafflePrizeWithWinner {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  rarity?: string | null;
  exterior?: string | null;
  float?: number | null;
  provider?: string;
  winnerId?: string | null;
  winner?: RaffleWinnerUser | null;
  winningTicket?: { ticketNumber: number } | null;
}

export function hasPrizeWinner(prize: RafflePrizeWithWinner) {
  return Boolean(prize.winner ?? prize.winnerId);
}

export function getPrizeWinner(prize: RafflePrizeWithWinner): RaffleWinnerUser | null {
  return prize.winner ?? null;
}

export function getUniqueWinners(prizes: RafflePrizeWithWinner[]): RaffleWinnerUser[] {
  const map = new Map<string, RaffleWinnerUser>();
  for (const p of prizes) {
    const winner = getPrizeWinner(p);
    if (winner && winner.id && !map.has(winner.id)) {
      map.set(winner.id, winner);
    }
  }
  return Array.from(map.values());
}

export function countPrizeWinners(prizes: RafflePrizeWithWinner[]) {
  return getUniqueWinners(prizes).length;
}
