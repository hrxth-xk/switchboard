"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp } from "@/lib/motion";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <motion.section animate="visible" className="auth-card" initial="hidden" variants={fadeInUp}>
      {children}
    </motion.section>
  );
}
