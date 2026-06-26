declare const phe: any;

export interface EVResult {
  holecards: string;
  evPlay: number;
  evNoPlay: number;
}

export const cardToIntLookup: Record<string, number> = {
  '2c': 0, '2d': 1, '2h': 2, '2s': 3,
  '3c': 4, '3d': 5, '3h': 6, '3s': 7,
  '4c': 8, '4d': 9, '4h': 10, '4s': 11,
  '5c': 12, '5d': 13, '5h': 14, '5s': 15,
  '6c': 16, '6d': 17, '6h': 18, '6s': 19,
  '7c': 20, '7d': 21, '7h': 22, '7s': 23,
  '8c': 24, '8d': 25, '8h': 26, '8s': 27,
  '9c': 28, '9d': 29, '9h': 30, '9s': 31,
  'Tc': 32, 'Td': 33, 'Th': 34, 'Ts': 35,
  'Jc': 36, 'Jd': 37, 'Jh': 38, 'Js': 39,
  'Qc': 40, 'Qd': 41, 'Qh': 42, 'Qs': 43,
  'Kc': 44, 'Kd': 45, 'Kh': 46, 'Ks': 47,
  'Ac': 48, 'Ad': 49, 'Ah': 50, 'As': 51
};

export const intToCardLookup: string[] = [
  '2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c', '4d', '4h', '4s',
  '5c', '5d', '5h', '5s', '6c', '6d', '6h', '6s', '7c', '7d', '7h', '7s',
  '8c', '8d', '8h', '8s', '9c', '9d', '9h', '9s', 'Tc', 'Td', 'Th', 'Ts',
  'Jc', 'Jd', 'Jh', 'Js', 'Qc', 'Qd', 'Qh', 'Qs', 'Kc', 'Kd', 'Kh', 'Ks',
  'Ac', 'Ad', 'Ah', 'As'
];

export function formatCards(cards: string): string {
  if (!cards) return "";
  let formattedCards = "";
  for (let i = 0; i < cards.length; i++) {
    const char = cards[i];
    if (/[tjqka]/.test(char)) {
      formattedCards += char.toUpperCase();
    } else if (/[CDHS]/.test(char)) {
      formattedCards += char.toLowerCase();
    } else {
      formattedCards += char;
    }
  }
  return formattedCards;
}

export function validateCards(board: string, dead: string, hole: string): boolean {
  const cardSet = new Set<string>();
  const allCards = (board + dead + hole).match(/[23456789TJQKA][cdhs]/g) || [];

  for (const card of allCards) {
    if (cardSet.has(card)) {
      return false;
    }
    cardSet.add(card);
  }
  return true;
}

function getBlindPayout(hRank: number): number {
  if (hRank === 1) return 500;
  else if (phe.handRank(hRank) === phe.ranks.STRAIGHT_FLUSH) return 50;
  else if (phe.handRank(hRank) === phe.ranks.FOUR_OF_A_KIND) return 10;
  else if (phe.handRank(hRank) === phe.ranks.FULL_HOUSE) return 3;
  else if (phe.handRank(hRank) === phe.ranks.FLUSH) return 1.5;
  else if (phe.handRank(hRank) === phe.ranks.STRAIGHT) return 1;
  return 0;
}

export function getEV(
  hole0: number,
  hole1: number,
  iboard: number[],
  deck: number[],
  anteSize: number,
  blindSize: number,
  riverBetSize: number
): [number, number] {
  let totalPayoutPlay = 0;
  let totalPayoutNoPlay = 0;
  let sims = 0;

  for (let dealer1 = 0; dealer1 < deck.length - 1; ++dealer1) {
    for (let dealer2 = dealer1 + 1; dealer2 < deck.length; ++dealer2) {
      sims++;
      const dealerRank = phe.evaluateCardCodes([deck[dealer1], deck[dealer2], ...iboard]);
      const playerRank = phe.evaluateCardCodes([hole0, hole1, ...iboard]);
      const dealerQualifies = phe.handRank(dealerRank) <= phe.ranks.ONE_PAIR;

      let payoutPlay = 0;
      const payoutNoPlay = -anteSize - blindSize;
      const playBet = blindSize * riverBetSize;

      if (playerRank === dealerRank) {
        // Tie: Payout remains 0
      } else if (playerRank < dealerRank) {
        const blindPayout = blindSize * getBlindPayout(playerRank);
        payoutPlay += blindPayout;
        if (dealerQualifies) {
          payoutPlay += anteSize;
        }
        payoutPlay += playBet;
      } else {
        payoutPlay -= blindSize;
        if (dealerQualifies) {
          payoutPlay -= anteSize;
        }
        payoutPlay -= playBet;
      }

      totalPayoutPlay += payoutPlay;
      totalPayoutNoPlay += payoutNoPlay;
    }
  }

  return [totalPayoutPlay / sims, totalPayoutNoPlay / sims];
}

export function generateRandomCardsHelper(
  targetType: "board" | "dead",
  numDead: number,
  boardStr: string,
  deadStr: string,
  holeStr: string
): string {
  const numCards = targetType === "dead" ? numDead : 5;
  const boardCards = boardStr.match(/[23456789TJQKA][cdhs]/g) || [];
  const deadCards = deadStr.match(/[23456789TJQKA][cdhs]/g) || [];
  const holeCards = holeStr.match(/[23456789TJQKA][cdhs]/g) || [];
  const allUsedCards = new Set([...boardCards, ...deadCards, ...holeCards]);

  const ranks = "23456789TJQKA";
  const suits = "cdhs";
  const deck: string[] = [];

  for (const rank of ranks) {
    for (const suit of suits) {
      const card = rank + suit;
      if (!allUsedCards.has(card)) {
        deck.push(card);
      }
    }
  }

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  let randomCards = "";
  for (let i = 0; i < numCards && i < deck.length; i++) {
    randomCards += deck[i];
  }

  return randomCards;
}
