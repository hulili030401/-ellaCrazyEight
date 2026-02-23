export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'dealing' | 'player_turn' | 'ai_turn' | 'game_over' | 'selecting_suit';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHand: Card[];
  aiHand: Card[];
  currentSuit: Suit;
  currentRank: Rank;
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  lastAction: string;
}
