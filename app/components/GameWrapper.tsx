"use client";

import React, { useState } from "react";
import InstructionScreen from "./InstructionScreen";
import GameCanvas from "./GameCanvas";

export default function GameWrapper() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return <InstructionScreen onStart={() => setGameStarted(true)} />;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <GameCanvas />
    </div>
  );
}
