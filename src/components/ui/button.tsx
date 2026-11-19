"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { useAnimate, useReducedMotion } from "motion/react";
import { buttonVariants } from "@/components/ui/button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const animateButton = (state: { y?: number; scale?: number }) => {
    if (reducedMotion || !scope.current) return;
    void animate(scope.current, state, {
      type: "spring",
      stiffness: 500,
      damping: 32,
    });
  };

  return (
    <ButtonPrimitive
      ref={scope}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        animateButton({ y: -1 });
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        animateButton({ y: 0, scale: 1 });
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        animateButton({ scale: 0.98 });
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        animateButton({ y: -1, scale: 1 });
      }}
      {...props}
    />
  );
}

export { Button };
