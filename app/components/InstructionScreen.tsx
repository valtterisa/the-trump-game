"use client";

import React from "react";

interface InstructionScreenProps {
  onStart: () => void;
}

const InstructionScreen: React.FC<InstructionScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl md:text-5xl font-bold mb-1 text-center">
        Trump Game
      </h1>
      <p className="text-gray-300">Perhaps the best game ever made</p>
      <div className="mt-4 max-w-[30rem]">
        <p className="text-base md:text-lg mb-4 text-center">
          Move with arrow keys (or on-screen buttons) and press space to shoot.
        </p>
        <p className="text-base md:text-lg mb-8 text-center">
          Collect Putin for health and Elon for guns. Tap Start Game to begin.
        </p>
      </div>
      <button
        onClick={onStart}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-lg font-semibold"
      >
        Start Game
      </button>
    </div>
  );
};

export default InstructionScreen;
