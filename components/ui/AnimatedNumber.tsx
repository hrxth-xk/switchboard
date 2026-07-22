"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
};

export function AnimatedNumber({ value, duration = 0.6, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      previous.current = value;
      setDisplay(value);
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate(latest) {
        setDisplay(Math.round(latest));
      }
    });

    previous.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
