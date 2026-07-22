"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp } from "@/lib/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div animate="visible" initial="hidden" key={pathname} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
