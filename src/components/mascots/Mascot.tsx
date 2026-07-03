"use client";

import { forwardRef, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "../../lib/utils";
import { floatingAnimation, mascotHover } from "../../lib/animations";
import {
  mascotFloatDuration,
  mascotLabel,
  resolveMascotAssetCandidates,
} from "../../lib/mascots";

export type MascotType =
  | "bella-bunny"
  | "gigi-giraffe"
  | "poppy-panda"
  | "eli-elephant"
  | "penny-penguin"
  | "benny-bear"
  | "freddy-ferret";

export type MascotPose =
  | "default"
  | "default-standing"
  | "welcome"
  | "wave"
  | "peek"
  | "reading"
  | "hug"
  | "sleeping"
  | "studying"
  | "celebration"
  | "hold-heart"
  | "hold-product";

export interface MascotProps {
  mascot: MascotType;
  pose?: MascotPose;
  size?: number;
  priority?: boolean;
  className?: string;
  animated?: boolean;
  floating?: boolean;
  interactive?: boolean;
  duration?: number;
  delay?: number;
  /** Pass empty string only for purely decorative mascots inside aria-hidden containers. */
  alt?: string;
}

const Mascot = forwardRef<HTMLDivElement | HTMLImageElement, MascotProps>(
  function Mascot(
    {
      mascot,
      pose = "default",
      size = 120,
      priority = false,
      className,
      animated = false,
      floating = false,
      interactive = false,
      duration,
      delay = 0,
      alt,
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion();
    const candidates = useMemo(
      () => resolveMascotAssetCandidates(mascot, pose),
      [mascot, pose],
    );
    const [candidateIndex, setCandidateIndex] = useState(0);
    const src = candidates[candidateIndex];
    const resolvedAlt = alt === "" ? "" : (alt ?? `${mascotLabel(mascot)} mascot`);
    const floatDuration = duration ?? mascotFloatDuration(mascot);
    const exhausted = !src || candidateIndex >= candidates.length;

    const handleError = () => {
      setCandidateIndex((index) => index + 1);
    };

    if (exhausted) {
      return null;
    }

    const image = (
      <Image
        key={src}
        ref={animated ? undefined : (ref as React.Ref<HTMLImageElement>)}
        src={src}
        alt={resolvedAlt}
        width={size}
        height={size}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        draggable={false}
        onError={handleError}
        className={cn(
          "pointer-events-none select-none object-contain",
          interactive && "drop-shadow-[0_10px_28px_rgba(29,69,45,0.16)] filter",
          !animated && className,
        )}
        style={{ width: size, height: size }}
      />
    );

    if (!animated) {
      return image;
    }

    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "inline-block transform-gpu will-change-transform",
          interactive && "cursor-default",
          className,
        )}
        style={{ transform: "translateZ(0)" }}
        {...(floating && !prefersReducedMotion
          ? floatingAnimation(floatDuration, delay)
          : {})}
        {...(interactive && !prefersReducedMotion ? mascotHover : {})}
      >
        {image}
      </motion.div>
    );
  },
);

export default Mascot;
