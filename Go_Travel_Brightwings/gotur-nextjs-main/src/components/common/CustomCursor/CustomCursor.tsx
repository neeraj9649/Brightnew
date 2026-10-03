'use client'
import React, { useEffect, useRef, useState } from 'react';

// Define types for cursor position state
interface Position {
    x: number;
    y: number;
}

// Define possible cursor color mappings
const CURSOR_COLORS: { [key: string]: string } = {
    "h1": "green-400",
    "button": "orange-500",
    "default": "sky-500"
};

const CustomCursor: React.FC = () => {
    // Reference to the cursor elements
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const cursorTwoRef = useRef<HTMLDivElement | null>(null);
    
    // State to track cursor position
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    useEffect(() => {
        const links = document.querySelectorAll("a");

        // Event listener for mouse movement
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        const handleMouseDown = () => {
            if (cursorRef.current) cursorRef.current.classList.add("click");
            if (cursorTwoRef.current) cursorTwoRef.current.classList.add("custom-cursor__innerhover");
        };

        const handleMouseUp = () => {
            if (cursorRef.current) cursorRef.current.classList.remove("click");
            if (cursorTwoRef.current) cursorTwoRef.current.classList.remove("custom-cursor__innerhover");
        };

        // Event listener for mouseover (hover) on HTML elements
        const handleMouseOver = () => {
            if (cursorRef.current) cursorRef.current.classList.add("custom-cursor__hover");
        };

        const handleMouseLeave = () => {
            if (cursorRef.current) cursorRef.current.classList.remove("custom-cursor__hover");
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);

        links.forEach((item) => {
            item.addEventListener("mouseover", handleMouseOver);
            item.addEventListener("mouseleave", handleMouseLeave);
        });

        // Cleanup event listeners on component unmount
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);

            links.forEach((item) => {
                item.removeEventListener("mouseover", handleMouseOver);
                item.removeEventListener("mouseleave", handleMouseLeave);
            });
        };
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="custom-cursor__cursor"
                style={{ transform: `translate3d(calc(${position.x}px - 50%), calc(${position.y}px - 50%), 0)` }}
            ></div>
            <div
                ref={cursorTwoRef}
                className="custom-cursor__cursor-two"
                style={{ top: position.y, left: position.x }}
            ></div>
        </>
    );
};

export default CustomCursor;
