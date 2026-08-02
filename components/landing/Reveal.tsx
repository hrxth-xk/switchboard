"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";

const TAGS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  li: motion.li,
  p: motion.p
} as const;

type RevealProps = {
  children: ReactNode;
  as?: keyof typeof TAGS;
  className?: string;
  delay?: number;
  /** Vertical travel in px — pass 0 for a pure fade. */
  distance?: number;
  id?: string;
};

/**
 * Scroll-triggered fade-up shared by every landing section. Plays once, and
 * is neutralised for users who ask for reduced motion via the landing
 * MotionConfig.
 */
export function Reveal({ children, as = "div", className, delay = 0, distance = 18, id }: RevealProps) {
  const Component = TAGS[as];

  return (
    <Component
      className={className}
      id={id}
      initial={{ opacity: 0, y: distance }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay }}
      viewport={{ once: true, amount: 0.15 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </Component>
  );
}
