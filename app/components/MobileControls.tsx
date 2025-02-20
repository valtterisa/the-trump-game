"use client";

import React from "react";
import Joystick from "./Joystick";

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

export default MobileControls;