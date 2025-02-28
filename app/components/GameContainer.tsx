"use client";

import React from "react";
import { DesktopGameCanvas } from "./DesktopGameCanvas";
import { MobileGameCanvas } from "./MobileGameCanvas";

const GameContainer: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      {/* Desktop: visible on medium screens and up */}
      <div className="hidden md:block">
        <DesktopGameCanvas />
      </div>
      {/* Mobile: visible on small screens */}
      <div className="block md:hidden">
        <MobileGameCanvas />
      </div>
    </div>
  );
};

export default GameContainer;
