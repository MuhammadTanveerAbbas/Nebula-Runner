"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

// Developer Note: This component contains the core game logic for "Nebula Runner".
// - It manages the player, obstacles (asteroids, debris, black holes), and collectables.
// - The game loop is controlled by `requestAnimationFrame` for smooth animation.
// - Player control is handled via mouse and touch movement.
// - Collision detection determines when the game ends. One hit and it's game over.

type GamePlayerProps = {
  onEndGame: (score: number) => void;
  onCollision: () => void;
};

// Type definitions for game objects
type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Obstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  type: 'asteroid' | 'debris' | 'blackhole';
  text?: string;
  rotation: number;
  rotationSpeed: number;
  shape: { x: number; y: number }[]; // For rock shape
};

type ScoreBooster = {
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
};

type GameState = 'countdown' | 'playing' | 'ended';

const DEBRIS_COLOR = 'hsl(var(--primary))';
const ASTEROID_COLOR = 'hsl(var(--muted-foreground))';
const BOOSTER_COLOR = 'hsl(150 100% 60%)';
const PLAYER_COLOR = 'hsl(var(--foreground))';
const MTA_TEXT_COLOR = 'hsl(var(--background))';
const BLACK_HOLE_COLOR_1 = 'hsl(260 100% 20%)';
const BLACK_HOLE_COLOR_2 = 'hsl(260 100% 5%)';

export default function GamePlayer({ onEndGame, onCollision }: GamePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [gameState, setGameState] = useState<GameState>('countdown');

  // Using refs for game state to avoid re-renders inside the game loop
  const playerRef = useRef<Player>({ x: 0, y: 0, width: 20, height: 30 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const boostersRef = useRef<ScoreBooster[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animationFrameId = useRef<number>();
  const lastObstacleTime = useRef<number>(0);
  const lastBoosterTime = useRef<number>(0);
  const lastBlackHleTime = useRef<number>(0);
  const scoreRef = useRef(0);
  const gameTimeRef = useRef(0);
  let nextId = 0;

  // Function to generate a rock-like shape
  const createRockShape = (size: number) => {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 5); // 8-12 points
    const angleStep = (Math.PI * 2) / numPoints;
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const radius = size * (0.7 + Math.random() * 0.3); // Varying radius
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
    return points;
  };

  const drawPlayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    ctx.fillStyle = PLAYER_COLOR;
    
    const w = player.width;
    const h = player.height;
    const x = player.x - w/2;
    const y = player.y - h/2;

    ctx.beginPath();
    // A simple pixelated rocket shape
    ctx.rect(x + w * 2/5, y, w/5, h/5); // Tip
    ctx.rect(x + w * 1/5, y + h * 1/5, w * 3/5, h * 1/5); // Upper body
    ctx.rect(x, y + h * 2/5, w, h * 2/5); // Main body
    ctx.rect(x + w * 1/5, y + h * 4/5, w * 3/5, h * 1/5); // bottom
    ctx.fill();

    // Rocket flame
    if (gameState === 'playing') {
        const flameHeight = player.height / 2 + Math.random() * player.height / 2;
        const flameColor = `hsl(${Math.random() * 60}, 100%, 50%)`;
        ctx.fillStyle = flameColor;
        ctx.beginPath();
        const flameWidth = player.width * (Math.random() * 0.3 + 0.6);
        ctx.rect(player.x - flameWidth/2, player.y + player.height/2, flameWidth, flameHeight);
        ctx.fill();
    }
  }, [gameState]);

  const drawStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const warpSpeedFactor = 1 + Math.min(scoreRef.current / 500, 10);
    ctx.fillStyle = 'white';
    starsRef.current.forEach(star => {
        if (gameState === 'playing') {
            star.y += star.speed * warpSpeedFactor;
        }
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }, [gameState]);

  const drawCountdown = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = `bold ${canvas.width/8}px Silkscreen`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (countdown > 0) {
        ctx.fillText(`${countdown}`, canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillText('GO!', canvas.width / 2, canvas.height / 2);
    }
  }, [countdown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const drawInitialCountdown = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStars(); // Draw a static background
      drawPlayer(); // Draw the player
      drawCountdown();
    };
  
    if (gameState === 'countdown') {
        drawInitialCountdown();
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                setGameState('playing');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }
  }, [countdown, gameState, drawCountdown, drawPlayer, drawStars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Game Setup ---
    const setupGame = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }

      playerRef.current = {
        x: canvas.width / 2,
        y: canvas.height - 60,
        width: Math.max(12, canvas.width / 55),
        height: Math.max(18, canvas.width / 36),
      };

      obstaclesRef.current = [];
      boostersRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      lastObstacleTime.current = 0;
      lastBoosterTime.current = 0;
      lastBlackHleTime.current = 0;
      gameTimeRef.current = 0;
      nextId = 0;

      // Create stars
      starsRef.current = [];
      for (let i = 0; i < 150; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 0.5,
          speed: Math.random() * 0.5 + 0.2,
        });
      }
    };

    // --- Game Loop ---
    const gameLoop = (timestamp: number) => {
      
      if (gameState === 'playing') {
        gameTimeRef.current += 16.67; // approximate ms per frame
  
        // --- Update Logic ---
        
        // Spawn new obstacles
        const obstacleSpawnInterval = Math.max(100, 400 - gameTimeRef.current / 500);
        if (timestamp - lastObstacleTime.current > obstacleSpawnInterval) {
          lastObstacleTime.current = timestamp;
          const size = Math.random() * 8 + 4;
          const isDebris = Math.random() > 0.6; // 60% chance of being debris
          const hasMTA = !isDebris && Math.random() < 0.15; // 15% chance for an asteroid to have "MTA"
          obstaclesRef.current.push({
            id: nextId++,
            x: Math.random() * canvas.width,
            y: -size,
            size: isDebris ? size * 0.5 : size,
            speed: (Math.random() * 1 + 1 + gameTimeRef.current / 2000) * (isDebris ? 1.5 : 1),
            type: isDebris ? 'debris' : 'asteroid',
            text: hasMTA ? 'MTA' : undefined,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            shape: isDebris ? [] : createRockShape(size),
          });
        }
  
        // Spawn new score boosters
        const boosterSpawnInterval = 6000; // Every 6 seconds
        if (timestamp - lastBoosterTime.current > boosterSpawnInterval) {
            lastBoosterTime.current = timestamp;
            const size = 15;
            boostersRef.current.push({
                id: nextId++,
                x: Math.random() * canvas.width,
                y: -size,
                size: size,
                speed: 3 + gameTimeRef.current / 4000
            });
        }
  
        // Spawn new black holes
        const blackHoleSpawnInterval = 12000; // Every 12 seconds
        if (timestamp - lastBlackHleTime.current > blackHoleSpawnInterval && scoreRef.current > 30) {
          lastBlackHleTime.current = timestamp;
          const size = Math.random() * 25 + 30;
          obstaclesRef.current.push({
            id: nextId++,
            x: Math.random() * (canvas.width - size * 2) + size,
            y: -size,
            size: size,
            speed: 2 + gameTimeRef.current / 5000,
            type: 'blackhole',
            rotation: 0,
            rotationSpeed: 0.02,
            shape: [],
          });
        }
  
        // Move obstacles and check for dodges
        obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
          obstacle.y += obstacle.speed;
          obstacle.rotation += obstacle.rotationSpeed;
          if (obstacle.y > canvas.height + obstacle.size) {
              scoreRef.current += 1;
              setScore(scoreRef.current);
              return false; // Remove from array
          }
          return true;
        });
  
        // Move boosters
        boostersRef.current = boostersRef.current.filter(booster => {
          booster.y += booster.speed;
          return booster.y < canvas.height + booster.size;
        });
  
  
        // --- Collision Detection & Physics ---
        const player = playerRef.current;
  
        // Black hole gravity
        obstaclesRef.current.forEach(obstacle => {
          if (obstacle.type === 'blackhole') {
            const dist = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
            const pullRange = obstacle.size * 5;
            if (dist < pullRange) {
              const angle = Math.atan2(obstacle.y - player.y, obstacle.x - player.x);
              const pullStrength = (1 - dist / pullRange) * 1.0; // Increased pull strength
              player.x += Math.cos(angle) * pullStrength;
              player.y += Math.sin(angle) * pullStrength;
            }
          }
        });
  
  
        // Obstacle collision
        for (const obstacle of obstaclesRef.current) {
          const dist = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
          const collisionThreshold = obstacle.type === 'blackhole' ? obstacle.size * 0.7 : obstacle.size;
          // Adjust player collision bounding box to be tighter
          const playerCollisionRadius = player.width / 3;
          if (dist < playerCollisionRadius + collisionThreshold) {
              onCollision();
              setGameState('ended');
              onEndGame(scoreRef.current);
              return; // Exit gameLoop
          }
        }
  
        // Booster collection
        boostersRef.current = boostersRef.current.filter(booster => {
            const dist = Math.hypot(player.x - booster.x, player.y - booster.y);
            if (dist < player.width/2 + booster.size) {
                scoreRef.current += 25; // Award 25 points
                setScore(scoreRef.current);
                return false; // Remove booster
            }
            return true;
        });
      }


      // --- Draw Logic ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawStars();

      // Draw obstacles
      obstaclesRef.current.forEach(o => {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rotation);
        
        if (o.type === 'blackhole') {
            const gradient = ctx.createRadialGradient(0, 0, o.size * 0.1, 0, 0, o.size);
            gradient.addColorStop(0, BLACK_HOLE_COLOR_1);
            gradient.addColorStop(0.7, BLACK_HOLE_COLOR_2);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, o.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = o.type === 'debris' ? DEBRIS_COLOR : ASTEROID_COLOR;
            ctx.beginPath();
            if (o.type === 'debris') {
                ctx.rect(-o.size / 2, -o.size / 2, o.size, o.size);
            } else {
                // Draw rock shape
                if (o.shape.length > 0) {
                  ctx.moveTo(o.shape[0].x, o.shape[0].y);
                  for (let i = 1; i < o.shape.length; i++) {
                    ctx.lineTo(o.shape[i].x, o.shape[i].y);
                  }
                  ctx.closePath();
                } else { // Fallback to circle
                  ctx.arc(0, 0, o.size, 0, Math.PI * 2);
                }
            }
            ctx.fill();

            if (o.text) {
              ctx.fillStyle = MTA_TEXT_COLOR;
              ctx.font = `bold ${o.size * 0.7}px Silkscreen`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(o.text, 0, 0);
            }
        }
        ctx.restore();
      });

      // Draw score boosters
      ctx.fillStyle = BOOSTER_COLOR;
      ctx.shadowBlur = 20;
      ctx.shadowColor = BOOSTER_COLOR;
      boostersRef.current.forEach(b => {
          ctx.beginPath();
          // Pulsing effect
          const pulse = gameState === 'playing' ? Math.sin(gameTimeRef.current / 200) * 2 : 0;
          ctx.arc(b.x, b.y, b.size + pulse, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.shadowBlur = 0; // Reset shadow

      // Draw player
      drawPlayer();

      if (gameState === 'countdown') {
        drawCountdown();
      }

      // Continue the loop
      if (gameState !== 'ended') {
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    };

    // --- Event Handlers ---
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || gameState !== 'playing') return;
      const rect = canvasRef.current.getBoundingClientRect();
      playerRef.current.x = e.clientX - rect.left;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!canvasRef.current || gameState !== 'playing') return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        playerRef.current.x = e.touches[0].clientX - rect.left;
    };
    
    const handleResize = () => {
        setupGame();
    };

    // --- Initialization & Cleanup ---
    setupGame();
    if (gameState === 'playing' || gameState === 'ended' || gameState === 'countdown') {
      window.addEventListener('resize', handleResize);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }


    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [onEndGame, onCollision, gameState, drawPlayer, drawStars, drawCountdown]);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full h-full animate-fade-in">
        <div className="w-full h-full max-w-4xl aspect-[4/3] sm:aspect-video bg-muted/30 rounded-lg shadow-2xl shadow-primary/10 border border-border overflow-hidden relative">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full"
                aria-label="Game player canvas"
            />
            <div className="absolute top-2 left-3 sm:top-4 sm:left-4 text-lg sm:text-2xl font-bold text-foreground/80 tracking-widest">
              SCORE: {score}
            </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground px-4">Move your mouse or finger to control the ship. One hit and the game is over!</p>
    </div>
  );
}
