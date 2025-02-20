"use client";

import React, { useRef } from "react";

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

export default Joystick;