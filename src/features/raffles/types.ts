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

export function countPrizeWinners(prizes: RafflePrizeWithWinner[]) {
  return prizes.filter(hasPrizeWinner).length;
}
