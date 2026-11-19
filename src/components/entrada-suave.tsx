"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

export function EntradaSuave({
  children,
  className,
  demora = 0,
}: {
  children: ReactNode;
  className?: string;
  demora?: number;
}) {
  return (
    <motion.div
      className={className}
      data-motion-entry=""
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.48,
        delay: demora,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
