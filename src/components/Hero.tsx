import type { GameStatus } from '@/app/page';

// Developer Note: This is the hero section for the landing page.
// It displays the game title, a description, and an icon.
// It also shows a "Game Over" message if the `isEnded` prop is true.
// The `font-headline` class uses the "Bungee Shade" font defined in `tailwind.config.ts`.

type HeroProps = {
  gameStatus: GameStatus;
  score?: number;
};

const PixelRocket = () => (
    <svg width="64" height="64" viewBox="0 0 16 16" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-accent" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="currentColor">
            <path d="M7 2H9V3H7V2Z" />
            <path d="M6 3H7V4H6V3Z" />
            <path d="M9 3H10V4H9V3Z" />
            <path d="M5 4H6V5H5V4Z" />
            <path d="M10 4H11V5H10V4Z" />
            <path d="M7 4H9V6H7V4Z" />
            <path d="M5 5H7V7H5V5Z" />
            <path d="M9 5H11V7H9V5Z" />
            <path d="M5 7H6V9H5V7Z" />
            <path d="M10 7H11V9H10V7Z" />
            <path d="M6 9H7V10H6V9Z" />
            <path d="M9 9H10V10H9V9Z" />
            <path d="M7 10H9V12H7V10Z" />
            <path d="M4 12H5V13H4V12Z" />
            <path d="M11 12H12V13H11V12Z" />
            <path d="M7 12H9V13H7V12Z" />
            <path d="M3 13H4V14H3V13Z" />
            <path d="M12 13H13V14H12V13Z" />
        </g>
    </svg>
);


export default function Hero({ gameStatus, score = 0 }: HeroProps) {
  const isEnded = gameStatus === 'ended';

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 animate-fade-in text-center">
      {isEnded && (
        <div className="flex flex-col gap-1 sm:gap-2">
            <p className="text-xl sm:text-2xl md:text-4xl font-bold text-accent tracking-wider animate-pulse">
            Game Over
            </p>
            <p className="text-base sm:text-lg md:text-2xl text-muted-foreground">
                Your final score: <span className="font-bold text-foreground">{score}</span>
            </p>
        </div>
      )}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* The Rocket icon can be replaced with a custom SVG logo */}
        <PixelRocket />
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-headline text-foreground tracking-wider">
          Nebula Runner
        </h1>
      </div>
      <p className="max-w-2xl text-xs sm:text-sm md:text-lg text-muted-foreground">
        An epic journey through space. Dodge asteroids, collect score boosters, and set a new high score in this thrilling arcade runner. Your mission awaits, pilot.
      </p>
    </div>
  );
}
