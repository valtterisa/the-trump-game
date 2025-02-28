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

export const DesktopGameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Desktop scale factor
    const scale = 1;

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

    // Game state.
    const trump: GameObject & { health: number } = {
      x: canvasWidth / 2 - 50,
      y: canvasHeight / 2 - 50,
      width: 100,
      height: 100,
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

    // Spawn functions.
    const spawnEnemy = () => {
      const enemyWidth = 120;
      const enemyHeight = 120;
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

    const spawnPutin = () => {
      const size = 80;
      putin = {
        x: Math.random() * (canvasWidth - size),
        y: Math.random() * (canvasHeight - size),
        width: size,
        height: size,
      };
    };

    const spawnElon = () => {
      const size = 80;
      elon = {
        x: Math.random() * (canvasWidth - size),
        y: Math.random() * (canvasHeight - size),
        width: size,
        height: size,
      };
    };

    // Timers and keyboard controls.
    let lastEnemySpawn = 0;
    const enemySpawnInterval = 500;
    let lastPutinSpawn = 0;
    const putinSpawnInterval = 10000;
    let lastElonSpawn = 0;
    const elonSpawnInterval = 15000;
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
      if (pressedKeys[" "]) {
        if (timestamp - lastBulletFired > bulletInterval) {
          const bulletSize = 15;
          if (weaponBoost) {
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
      ctx.drawImage(trumpImg, trump.x, trump.y, trump.width, trump.height);
      enemies.forEach((enemy) => {
        drawCircularImage(
          ctx,
          enemy.img,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );
      });
      bullets.forEach((bullet) => {
        drawCircle(
          ctx,
          bullet.x + bullet.width / 2,
          bullet.y + bullet.height / 2,
          bullet.width / 2,
          "yellow"
        );
      });
      if (putin) {
        drawCircularImage(
          ctx,
          putinImg,
          putin.x,
          putin.y,
          putin.width,
          putin.height
        );
      }
      if (elon) {
        drawCircularImage(
          ctx,
          elonImg,
          elon.x,
          elon.y,
          elon.width,
          elon.height
        );
      }
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText("Score: " + score, 20, canvasHeight - 110);
      ctx.fillText("Health: " + trump.health, 20, canvasHeight - 90);
    };

    const animId = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full border border-white" />
      {gameOver && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-80">
          <h1 className="text-3xl font-bold text-white mb-4">Game Over</h1>
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
