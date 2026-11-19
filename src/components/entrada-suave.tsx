"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";

export function EntradaSuave({
  children,
  className,
  demora = 0,
}: {
  children: ReactNode;
  className?: string;
  demora?: number;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const controls = animate(
      "[data-motion-item]",
      { opacity: [0, 1], y: [12, 0] },
      {
        duration: 0.45,
        delay: stagger(0.045),
        ease: [0.22, 1, 0.36, 1],
      },
    );
    return () => controls.stop();
  }, [animate, reducedMotion]);

  return (
    <motion.div
      ref={scope}
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
