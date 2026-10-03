// app/components/TextAnimation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TextAnimationProps {
  text: string;
  animationType: "fade" | "right" | "left" | "up" | "down" | "scale"; // Pass animation type
}

const AnimationTwo: React.FC<TextAnimationProps> = ({
  text,
  animationType,
}) => {
  const [splitText, setSplitText] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);

  // Split the text into individual characters, preserving spaces
  useEffect(() => {
    const sp = text.split(" ");
    const split = text
      .split(" ")
      .map((char) => (char === " " ? "\u00A0" : char)); // Using non-breaking space for spaces
    setSplitText(split);
  }, [text]);

  // Intersection Observer to trigger animation when the element enters the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // Set visibility to true when the element is in the viewport
        } else {
          setIsVisible(false); // Optionally, reset visibility when it leaves
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of the element is in the viewport
      }
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      if (textRef.current) {
        observer.unobserve(textRef.current);
      }
    };
  }, []);

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    right: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
    },
    left: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  return (
    <div ref={textRef}>
      <AnimatePresence>
        {splitText.map((char, index) => (
          <motion.div
            key={index} // Using the index to trigger animation on page load/re-render
            variants={variants[animationType]}
            initial='initial'
            animate={isVisible ? "animate" : "initial"} // Trigger animation only when visible
            exit='initial'
            transition={{
              delay: index * 0.1,
              duration: 1.0,
              ease: "easeInOut",
            }}
            style={{ display: "inline-block" }}
          >
            {char === "\u00A0" ? "\u00A0" : char}{" "}
            {/* Render space as a non-breaking space */}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnimationTwo;
