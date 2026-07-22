"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type StaggerListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  className?: string;
  itemClassName?: string;
};

export function StaggerList<T>({ items, getKey, renderItem, className, itemClassName }: StaggerListProps<T>) {
  return (
    <motion.ul animate="visible" className={className} initial="hidden" variants={staggerContainer}>
      {items.map((item) => (
        <motion.li className={itemClassName} key={getKey(item)} variants={fadeInUp}>
          {renderItem(item)}
        </motion.li>
      ))}
    </motion.ul>
  );
}
