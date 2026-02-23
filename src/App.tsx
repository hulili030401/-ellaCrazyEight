/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Hand, 
  Cpu, 
  Info, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, Suit, Rank, GameStatus, GameState } from './types';
import { 
  createDeck, 
  isValidMove, 
  SUIT_SYMBOLS, 
  SUIT_COLORS, 
  SUITS 
} from './constants';

// --- Components ---

interface CardViewProps {
  card?: Card;
  isFaceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  key?: React.Key;
}

const CardView = ({ 
  card, 
  isFaceDown = false, 
  onClick, 
  isPlayable = false,
  className = ""
}: CardViewProps) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0, x: 100 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05, rotate: 2 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl shadow-lg cursor-pointer transition-all duration-300
        ${isFaceDown ? 'bg-indigo-800 border-4 border-white' : 'bg-white border border-slate-200'}
        ${isPlayable ? 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/30 -translate-y-2' : 'grayscale-[0.2]'}
        flex items-center justify-center select-none
        ${className}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
          <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="absolute font-bold text-white/30 text-4xl">8</div>
        </div>
      ) : card ? (
        <div className={`w-full h-full p-2 flex flex-col justify-between ${SUIT_COLORS[card.suit]}`}>
          <div className="flex flex-col leading-none">
            <span className="text-lg sm:text-xl font-bold">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className="text-3xl sm:text-4xl self-center">
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="flex flex-col leading-none rotate-180">
            <span className="text-lg sm:text-xl font-bold">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

const SuitSelector = ({ onSelect }: { onSelect: (suit: Suit) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">选择一个花色</h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 
                hover:bg-indigo-50 transition-all flex flex-col items-center gap-2
                ${SUIT_COLORS[suit]}
              `}
            >
              <span className="text-4xl">{SUIT_SYMBOLS[suit]}</span>
              <span className="capitalize font-semibold">{suit === 'hearts' ? '红心' : suit === 'diamonds' ? '方块' : suit === 'clubs' ? '梅花' : '黑桃'}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const GameOver = ({ winner, onRestart }: { winner: 'player' | 'ai' | null; onRestart: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="text-center p-10 bg-white rounded-[40px] shadow-2xl max-w-md w-full mx-4">
        <div className="mb-6 inline-flex p-6 rounded-full bg-yellow-100">
          <Trophy className={`w-16 h-16 ${winner === 'player' ? 'text-yellow-600' : 'text-slate-400'}`} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-2">
          {winner === 'player' ? '你赢了！' : 'AI 赢了！'}
        </h2>
        <p className="text-slate-500 mb-8">
          {winner === 'player' ? '太棒了！你出完了所有的牌。' : '下次好运！AI 抢先一步出完了牌。'}
        </p>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          再玩一次
        </button>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pendingEight, setPendingEight] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initGame = useCallback(() => {
    try {
      const deck = createDeck();
      const playerHand = deck.splice(0, 8);
      const aiHand = deck.splice(0, 8);
      
      // Ensure first discard is not an 8 for simplicity
      let firstDiscardIndex = 0;
      while (deck[firstDiscardIndex] && deck[firstDiscardIndex].rank === '8') {
        firstDiscardIndex++;
      }
      
      if (!deck[firstDiscardIndex]) {
        throw new Error("无法找到非8的初始弃牌。");
      }

      const discardPile = [deck.splice(firstDiscardIndex, 1)[0]];

      setGameState({
        deck,
        discardPile,
        playerHand,
        aiHand,
        currentSuit: discardPile[0].suit,
        currentRank: discardPile[0].rank,
        status: 'player_turn',
        winner: null,
        lastAction: '游戏开始！轮到你了。'
      });
    } catch (err) {
      console.error("Initialization error:", err);
      setError(err instanceof Error ? err.message : "未知错误");
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWinner = (state: GameState) => {
    if (state.playerHand.length === 0) return 'player';
    if (state.aiHand.length === 0) return 'ai';
    return null;
  };

  const handleDraw = () => {
    if (!gameState || gameState.status !== 'player_turn') return;

    const newDeck = [...gameState.deck];
    if (newDeck.length === 0) {
      setGameState({
        ...gameState,
        status: 'ai_turn',
        lastAction: '牌堆已空！跳过回合。'
      });
      return;
    }

    const drawnCard = newDeck.pop()!;
    const newHand = [...gameState.playerHand, drawnCard];
    
    // Check if drawn card is playable immediately
    const canPlayDrawn = isValidMove(drawnCard, gameState.currentSuit, gameState.currentRank);

    setGameState({
      ...gameState,
      deck: newDeck,
      playerHand: newHand,
      lastAction: `你摸了一张 ${drawnCard.rank} (${drawnCard.suit === 'hearts' ? '红心' : drawnCard.suit === 'diamonds' ? '方块' : drawnCard.suit === 'clubs' ? '梅花' : '黑桃'})。`,
      // If they can't play it, it's AI's turn. If they can, they still have to play it manually or we could auto-play.
      // Rules usually say if you draw and can't play, turn ends.
      status: canPlayDrawn ? 'player_turn' : 'ai_turn'
    });
  };

  const handlePlayCard = (card: Card) => {
    if (!gameState || gameState.status !== 'player_turn') return;
    if (!isValidMove(card, gameState.currentSuit, gameState.currentRank)) return;

    const newHand = gameState.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [card, ...gameState.discardPile];

    if (card.rank === '8') {
      setPendingEight(card);
      setGameState({
        ...gameState,
        playerHand: newHand,
        discardPile: newDiscardPile,
        status: 'selecting_suit',
        lastAction: '你打出了 8！请选择一个新花色。'
      });
    } else {
      const newState: GameState = {
        ...gameState,
        playerHand: newHand,
        discardPile: newDiscardPile,
        currentSuit: card.suit,
        currentRank: card.rank,
        status: 'ai_turn',
        lastAction: `你打出了 ${card.rank} (${card.suit === 'hearts' ? '红心' : card.suit === 'diamonds' ? '方块' : card.suit === 'clubs' ? '梅花' : '黑桃'})。`
      };

      const winner = checkWinner(newState);
      if (winner) {
        setGameState({ ...newState, status: 'game_over', winner });
      } else {
        setGameState(newState);
      }
    }
  };

  const handleSuitSelection = (suit: Suit) => {
    if (!gameState || !pendingEight) return;

    const newState: GameState = {
      ...gameState,
      currentSuit: suit,
      currentRank: '8',
      status: 'ai_turn',
      lastAction: `花色已更改为 ${suit === 'hearts' ? '红心' : suit === 'diamonds' ? '方块' : suit === 'clubs' ? '梅花' : '黑桃'}！`
    };

    setPendingEight(null);
    setGameState(newState);
  };

  // AI Logic
  useEffect(() => {
    if (gameState?.status === 'ai_turn') {
      const timer = setTimeout(() => {
        const { aiHand, currentSuit, currentRank, deck, discardPile } = gameState;
        
        // Find playable cards
        const playable = aiHand.filter(c => isValidMove(c, currentSuit, currentRank));
        
        if (playable.length > 0) {
          // AI Strategy: Play non-8s first, then 8s
          const nonEight = playable.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playable[0];
          
          const newHand = aiHand.filter(c => c.id !== cardToPlay.id);
          const newDiscardPile = [cardToPlay, ...discardPile];
          
          let nextSuit = cardToPlay.suit;
          let nextAction = `AI 打出了 ${cardToPlay.rank} (${cardToPlay.suit === 'hearts' ? '红心' : cardToPlay.suit === 'diamonds' ? '方块' : cardToPlay.suit === 'clubs' ? '梅花' : '黑桃'})。`;

          if (cardToPlay.rank === '8') {
            // AI picks its most frequent suit
            const suitCounts = newHand.reduce((acc, c) => {
              acc[c.suit] = (acc[c.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            
            nextSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || 'hearts';
            nextAction = `AI 打出了 8 并将花色更改为 ${nextSuit === 'hearts' ? '红心' : nextSuit === 'diamonds' ? '方块' : nextSuit === 'clubs' ? '梅花' : '黑桃'}！`;
          }

          const newState: GameState = {
            ...gameState,
            aiHand: newHand,
            discardPile: newDiscardPile,
            currentSuit: nextSuit,
            currentRank: cardToPlay.rank,
            status: 'player_turn',
            lastAction: nextAction
          };

          const winner = checkWinner(newState);
          if (winner) {
            setGameState({ ...newState, status: 'game_over', winner });
          } else {
            setGameState(newState);
          }
        } else {
          // AI must draw
          if (deck.length > 0) {
            const newDeck = [...deck];
            const drawn = newDeck.pop()!;
            const newHand = [...aiHand, drawn];
            
            // Can AI play drawn card?
            const canPlayDrawn = isValidMove(drawn, currentSuit, currentRank);
            
            setGameState({
              ...gameState,
              deck: newDeck,
              aiHand: newHand,
              lastAction: 'AI 摸了一张牌。',
              status: canPlayDrawn ? 'ai_turn' : 'player_turn' // If can play, AI turn continues (recursive-ish via state update)
            });
          } else {
            setGameState({
              ...gameState,
              status: 'player_turn',
              lastAction: 'AI 跳过回合（牌堆已空）。'
            });
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 p-6 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">游戏初始化失败</h1>
          <p className="text-red-200/70 mb-4">{error}</p>
          <button onClick={() => { setError(null); initGame(); }} className="px-6 py-2 bg-red-500 rounded-full font-bold">重试</button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#1a472a] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="font-bold animate-pulse">正在加载游戏...</p>
        </div>
      </div>
    );
  }

  const topCard = gameState.discardPile[0];

  return (
    <div className="min-h-screen bg-[#1a472a] text-white font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
            曹
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">曹梓萱 疯狂 8 点</h1>
            <p className="text-xs text-white/50">经典纸牌游戏</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Info className="w-4 h-4 text-white/40" />
            <span className="text-sm font-medium text-white/70">{gameState.lastAction}</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative p-4 flex flex-col justify-between max-w-6xl mx-auto w-full">
        
        {/* AI Hand */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">对手 ({gameState.aiHand.length})</span>
          </div>
          <div className="flex -space-x-12 sm:-space-x-16 hover:-space-x-8 transition-all duration-300">
            {gameState.aiHand.map((_, i) => (
              <CardView key={i} isFaceDown className="rotate-[-2deg] hover:rotate-0" />
            ))}
          </div>
        </section>

        {/* Center Area (Deck & Discard) */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-20 my-8">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {gameState.deck.length > 0 && (
                <>
                  <div className="absolute top-1 left-1 w-20 h-28 sm:w-24 sm:h-36 bg-indigo-900 rounded-xl border-4 border-white/20 translate-x-1 translate-y-1" />
                  <CardView 
                    isFaceDown 
                    onClick={handleDraw}
                    isPlayable={gameState.status === 'player_turn'}
                    className="relative z-10"
                  />
                </>
              )}
              {gameState.deck.length === 0 && (
                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-white/20 font-bold">EMPTY</span>
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-tighter">摸牌区 ({gameState.deck.length})</span>
          </div>

          {/* Current Suit/Rank Indicator */}
          <div className="flex flex-col items-center gap-2">
             <div className="px-4 py-2 bg-black/30 rounded-2xl border border-white/10 flex items-center gap-3">
                <span className={`text-2xl ${SUIT_COLORS[gameState.currentSuit]}`}>{SUIT_SYMBOLS[gameState.currentSuit]}</span>
                <div className="h-4 w-px bg-white/10" />
                <span className="font-bold text-xl">{gameState.currentRank === '8' ? '任意' : gameState.currentRank}</span>
             </div>
             <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                <ChevronRight className="w-3 h-3" />
                当前目标
             </div>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {gameState.discardPile.slice(1, 4).map((card, i) => (
                <div 
                  key={card.id} 
                  className="absolute inset-0 w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-xl border border-slate-200 opacity-20"
                  style={{ transform: `rotate(${(i + 1) * 5}deg) translate(${(i + 1) * 2}px, ${(i + 1) * 2}px)` }}
                />
              ))}
              <CardView card={topCard} className="relative z-10" />
            </div>
            <span className="text-xs font-bold text-white/40 uppercase tracking-tighter">弃牌堆</span>
          </div>
        </section>

        {/* Player Hand */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Hand className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">你的手牌 ({gameState.playerHand.length})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-4">
            <AnimatePresence mode="popLayout">
              {gameState.playerHand.map((card) => (
                <CardView 
                  key={card.id} 
                  card={card} 
                  isPlayable={gameState.status === 'player_turn' && isValidMove(card, gameState.currentSuit, gameState.currentRank)}
                  onClick={() => handlePlayCard(card)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Status Bar (Mobile) */}
      <footer className="sm:hidden p-4 bg-black/40 border-t border-white/10 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-sm font-medium text-white/80 line-clamp-1">{gameState.lastAction}</p>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'selecting_suit' && (
          <SuitSelector onSelect={handleSuitSelection} />
        )}
        {gameState.status === 'game_over' && (
          <GameOver winner={gameState.winner} onRestart={initGame} />
        )}
      </AnimatePresence>
    </div>
  );
}
