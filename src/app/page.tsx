"use client";

// Developer Note: This is the main page component.
// It's a client component (`"use client"`) to manage the game's state.
// It orchestrates which components (Hero, GamePlayer) are displayed based on `gameStatus`.
// It also provides the callback functions to the CTA component to update the state.

import { useState, useCallback } from 'react';
import Hero from '@/components/Hero';
import GamePlayer from '@/components/GamePlayer';
import CTA from '@/components/CTA';
import { cn } from '@/lib/utils';
import { Github } from 'lucide-react';

// Defines the possible states of the game.
export type GameStatus = 'idle' | 'playing' | 'ended';

export default function Home() {
  // State to track the current status of the game.
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  const handleCollision = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  }

  // Callbacks to transition between game states.
  // `useCallback` is used for optimization, preventing re-creation of functions on re-renders.
  const startGame = useCallback(() => {
    setScore(0);
    setGameStatus('playing');
  }, []);
  const endGame = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameStatus('ended');
  }, []);
  const resetGame = useCallback(() => {
    setScore(0);
    setGameStatus('idle');
  }, []);

  return (
    <main className={cn(
      "flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-2 sm:p-4",
      isShaking && "animate-shake"
    )}>
      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-4 sm:gap-6 text-center flex-grow">
        
        {/* Show the Hero component on the idle/home screen and after a game ends. */}
        {gameStatus !== 'playing' && <Hero gameStatus={gameStatus} score={score} />}
        
        {/* Show the GamePlayer component only when the game is actively being played. */}
        {gameStatus === 'playing' && <GamePlayer onEndGame={endGame} onCollision={handleCollision} />}

        {/* The CTA component is always visible but its buttons change based on game status. */}
        <CTA 
          gameStatus={gameStatus} 
          onStart={startGame} 
          onRestart={startGame} 
          onHome={resetGame} 
        />
        
      </div>
      <footer className="w-full text-center p-2 sm:p-4">
        <a 
            href="https://github.com/MuhammadTanveerAbbas" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors inline-flex items-center gap-2"
        >
            <Github className="h-4 w-4" />
            <span>Connect with me on GitHub</span>
        </a>
      </footer>
    </main>
  );
}
