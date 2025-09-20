"use client";

import { Button } from '@/components/ui/button';
import { Play, RotateCw } from 'lucide-react';
import type { GameStatus } from '@/app/page';

// Developer Note: This component handles the main calls to action.
// Its appearance and behavior change based on the `gameStatus`.
// The buttons trigger callbacks passed as props (`onStart`, `onRestart`)
// to update the game state in the parent component (`app/page.tsx`).

type CTAProps = {
  gameStatus: GameStatus;
  onStart: () => void;
  onRestart: () => void;
  onHome: () => void; // Kept for potential future use, but not currently used.
};

export default function CTA({ gameStatus, onStart, onRestart }: CTAProps) {
  // If the game is in progress, no primary CTA is shown.
  if (gameStatus === 'playing') {
    return null;
  }

  // If the game has ended, show options to play again.
  if (gameStatus === 'ended') {
    return (
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
        <Button onClick={onRestart} size="lg" className="px-6 py-5 text-lg md:text-xl font-bold">
            <RotateCw className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            Play Again
        </Button>
      </div>
    );
  }

  // If the game is idle (on the main screen), show the "Start Game" button.
  return (
    <Button onClick={onStart} size="lg" className="px-8 py-5 text-lg md:px-12 md:text-2xl font-bold animate-pulse hover:animate-none">
        <Play className="mr-3 h-6 w-6 md:h-7 md:w-7" />
        Start Game
    </Button>
  );
}
