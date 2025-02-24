"use client";

import React, { useRef, useEffect, useState } from "react";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MovingObject extends GameObject {
  speed?: number;
  dx?: number;
}

interface Enemy extends MovingObject {
  img: HTMLImageElement;
  dx: number;
  dy: number;
}

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    onMove(dx, dy);
  };

  const handleTouchEnd = () => {
    onStop();
  };

  return (
    <div
      ref={joystickRef}
      className="w-16 h-16 bg-gray-700 rounded-full opacity-75"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Optionally, add a smaller inner knob */}
    </div>
  );
};

interface MobileControlsProps {
  onShoot: () => void;
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onShoot, onMove, onStop }) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col space-y-2 md:hidden">
      <Joystick onMove={onMove} onStop={onStop} />
      <button
        onClick={onShoot}
        className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
      >
        Shoot
      </button>
    </div>
  );
};

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas sizing (untouched):
    const isMobile = window.innerWidth < 600;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale factor: 1 on desktop, 0.5 on mobile.
    const scale = isMobile ? 0.5 : 1;

    // Preload images.
    const trumpImg = new Image();
    trumpImg.src = "/images/trump.jpg";

    const putinImg = new Image();
    putinImg.src = "/images/putin.jpg";

    const elonImg = new Image();
    elonImg.src = "/images/elon.webp";

    const agencyImagePaths = [
      "/images/fbi.svg",
      "/images/irs.png",
      "/images/sec.svg",
      "/images/usaid.png",
      "/images/zelenski.jpg",
    ];
    const agencyImages: HTMLImageElement[] = agencyImagePaths.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    // Helper: Draw an image clipped to a circle.
    const drawCircularImage = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
    };

    // Helper: Draw a filled circle.
    const drawCircle = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number,
      color: string
    ) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Game state – Trump remains rectangular.
    const trump: GameObject & { health: number } = {
      x: canvasWidth / 2 - (100 * scale) / 2,
      y: canvasHeight / 2 - (100 * scale) / 2,
      width: 100 * scale,
      height: 100 * scale,
      health: 100,
    };

    const bullets: MovingObject[] = [];
    const enemies: Enemy[] = [];
    let putin: GameObject | null = null;
    let elon: GameObject | null = null;
    let weaponBoost = false;
    let boostTimer = 0;
    let score = 0;
    const enemyDamage = 20;

    const isColliding = (a: GameObject, b: GameObject): boolean =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;

    // Enemies spawn only from the top.
    const spawnEnemy = () => {
      const enemyWidth = 120 * scale;
      const enemyHeight = 120 * scale;
      const x = Math.random() * (canvasWidth - enemyWidth);
      const y = -enemyHeight;
      const speed = 3 + Math.random() * 2;
      const enemy: Enemy = {
        x,
        y,
        width: enemyWidth,
        height: enemyHeight,
        speed,
        img: agencyImages[Math.floor(Math.random() * agencyImages.length)],
        dx: 0,
        dy: speed,
      };
      enemies.push(enemy);
    };

    // Markers as round images.
    const spawnPutin = () => {
      const size = 80 * scale;
      putin = {
        x: Math.random() * (canvasWidth - size),
        y: Math.random() * (canvasHeight - size),
        width: size,
        height: size,
      };
    };

    const spawnElon = () => {
      const size = 80 * scale;
      elon = {
        x: Math.random() * (canvasWidth - size),
        y: Math.random() * (canvasHeight - size),
        width: size,
        height: size,
      };
    };

    // Spawning timers.
    let lastEnemySpawn = 0;
    const enemySpawnInterval = 500; // spawn more frequently
    let lastPutinSpawn = 0;
    const putinSpawnInterval = 10000;
    let lastElonSpawn = 0;
    const elonSpawnInterval = 15000;

    // For continuous movement and shooting via keyboard.
    const pressedKeys: { [key: string]: boolean } = {};
    let lastBulletFired = 0;
    const bulletInterval = 300;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keysToPrevent = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        " ",
      ];
      if (keysToPrevent.includes(e.key)) e.preventDefault();
      pressedKeys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationFrameId: number;
    const update = (timestamp: number) => {
      if (trump.health <= 0) {
        setGameOver(true);
        draw();
        return;
      }

      if (timestamp - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
      }
      if (!putin && timestamp - lastPutinSpawn > putinSpawnInterval) {
        spawnPutin();
        lastPutinSpawn = timestamp;
      }
      if (!elon && timestamp - lastElonSpawn > elonSpawnInterval) {
        spawnElon();
        lastElonSpawn = timestamp;
      }

      const moveSpeed = 10;
      // Keyboard movement.
      if (pressedKeys["ArrowUp"] || pressedKeys["w"]) {
        trump.y = Math.max(trump.y - moveSpeed, 0);
      }
      if (pressedKeys["ArrowDown"] || pressedKeys["s"]) {
        trump.y = Math.min(trump.y + moveSpeed, canvasHeight - trump.height);
      }
      if (pressedKeys["ArrowLeft"] || pressedKeys["a"]) {
        trump.x = Math.max(trump.x - moveSpeed, 0);
      }
      if (pressedKeys["ArrowRight"] || pressedKeys["d"]) {
        trump.x = Math.min(trump.x + moveSpeed, canvasWidth - trump.width);
      }
      // Joystick movement.
      if (joystick.x !== 0 || joystick.y !== 0) {
        const mag = Math.sqrt(joystick.x * joystick.x + joystick.y * joystick.y);
        if (mag > 0) {
          const normX = joystick.x / mag;
          const normY = joystick.y / mag;
          trump.x = Math.min(
            Math.max(trump.x + normX * moveSpeed, 0),
            canvasWidth - trump.width
          );
          trump.y = Math.min(
            Math.max(trump.y + normY * moveSpeed, 0),
            canvasHeight - trump.height
          );
        }
      }

      if (pressedKeys[" "]) {
        if (timestamp - lastBulletFired > bulletInterval) {
          const bulletSize = 15 * scale;
          if (weaponBoost) {
            // Triple cannon shot.
            bullets.push({
              x: trump.x + trump.width / 2 - bulletSize / 2,
              y: trump.y,
              width: bulletSize,
              height: bulletSize,
              speed: 15,
              dx: 0,
            });
            bullets.push({
              x: trump.x + trump.width / 2 - bulletSize / 2,
              y: trump.y,
              width: bulletSize,
              height: bulletSize,
              speed: 15,
              dx: -3,
            });
            bullets.push({
              x: trump.x + trump.width / 2 - bulletSize / 2,
              y: trump.y,
              width: bulletSize,
              height: bulletSize,
              speed: 15,
              dx: 3,
            });
          } else {
            bullets.push({
              x: trump.x + trump.width / 2 - bulletSize / 2,
              y: trump.y,
              width: bulletSize,
              height: bulletSize,
              speed: 12,
              dx: 0,
            });
          }
          lastBulletFired = timestamp;
        }
      }

      enemies.forEach((enemy, index) => {
        enemy.y += enemy.dy;
        if (isColliding(trump, enemy)) {
          trump.health -= enemyDamage;
          enemies.splice(index, 1);
        }
      });

      bullets.forEach((bullet, bIndex) => {
        bullet.x += bullet.dx || 0;
        bullet.y -= bullet.speed || 0;
        if (
          bullet.y < 0 ||
          bullet.y > canvasHeight ||
          bullet.x < 0 ||
          bullet.x > canvasWidth
        ) {
          bullets.splice(bIndex, 1);
        } else {
          enemies.forEach((enemy, eIndex) => {
            if (isColliding(bullet, enemy)) {
              score += 10;
              enemies.splice(eIndex, 1);
              bullets.splice(bIndex, 1);
            }
          });
        }
      });

      if (putin && isColliding(trump, putin)) {
        if (trump.health < 100) trump.health += 20;
        putin = null;
      }
      if (elon && isColliding(trump, elon)) {
        weaponBoost = true;
        boostTimer = 20000;
        elon = null;
      }
      if (weaponBoost) {
        boostTimer -= 16;
        if (boostTimer <= 0) {
          weaponBoost = false;
          boostTimer = 0;
        }
      }

      draw();
      animationFrameId = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      // Draw Trump (rectangular).
      ctx.drawImage(trumpImg, trump.x, trump.y, trump.width, trump.height);
      // Draw enemies as round images.
      enemies.forEach((enemy) => {
        drawCircularImage(ctx, enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
      });
      // Draw bullets as yellow circles.
      bullets.forEach((bullet) => {
        drawCircle(
          ctx,
          bullet.x + bullet.width / 2,
          bullet.y + bullet.height / 2,
          bullet.width / 2,
          "yellow"
        );
      });
      // Draw markers as round images.
      if (putin) {
        drawCircularImage(ctx, putinImg, putin.x, putin.y, putin.width, putin.height);
      }
      if (elon) {
        drawCircularImage(ctx, elonImg, elon.x, elon.y, elon.width, elon.height);
      }
      // Draw HUD in bottom left.
      const margin = 20;
      const hudBottom = canvasHeight - margin;
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "start";
      ctx.fillText("Score: " + score, margin, hudBottom - 110);
      ctx.fillText("Health: " + trump.health, margin, hudBottom - 90);
      ctx.fillText("Weapon Boost: " + (weaponBoost ? "Active" : "Inactive"), margin, hudBottom - 70);
      const barWidth = 300;
      const barHeight = 25;
      const healthPercent = Math.max(trump.health / 100, 0);
      ctx.fillStyle = "red";
      ctx.fillRect(margin, hudBottom - 60, barWidth, barHeight);
      ctx.fillStyle = "green";
      ctx.fillRect(margin, hudBottom - 60, barWidth * healthPercent, barHeight);
      ctx.strokeStyle = "white";
      ctx.strokeRect(margin, hudBottom - 60, barWidth, barHeight);
      // Draw control keys at the very bottom.
      ctx.fillText("Controls: Arrow keys / WASD to move, Space to shoot", margin, hudBottom - 20);
    };

    const animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [joystick]);

  // Mobile-specific callbacks.
  const handleShoot = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  };

  const handleJoystickMove = (dx: number, dy: number) => {
    setJoystick({ x: dx, y: dy });
  };

  const handleJoystickStop = () => {
    setJoystick({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center">
      <canvas ref={canvasRef} className="w-full h-full border border-white" />
      <div className="md:hidden">
        <MobileControls
          onShoot={handleShoot}
          onMove={handleJoystickMove}
          onStop={handleJoystickStop}
        />
      </div>
      {gameOver && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-80">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Game Over</h1>
          <video
            src="/videos/ai-trump.mp4"
            autoPlay
            muted
            className="max-w-full max-h-full"
          />
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;