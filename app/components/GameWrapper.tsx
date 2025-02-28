"use client";

import React, { useState } from "react";
import InstructionScreen from "./InstructionScreen";
import GameContainer from "./GameContainer";

export default function GameWrapper() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return <InstructionScreen onStart={() => setGameStarted(true)} />;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <GameContainer />
    </div>
  );
}
