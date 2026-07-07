"use client";

import { forwardRef, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";

import { mascotImageQuality, mascotImageSizes } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";
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
    const candidates = useMemo(
      () => resolveMascotAssetCandidates(mascot, pose),
      [mascot, pose],
    );
    const [candidateIndex, setCandidateIndex] = useState(0);
    const src = candidates[candidateIndex];
    const resolvedAlt = alt === "" ? "" : (alt ?? `${mascotLabel(mascot)} mascot`);
    const floatDuration = duration ?? mascotFloatDuration(mascot);
    const exhausted = !src || candidateIndex >= candidates.length;

    const floatStyle = useMemo(
      () =>
        ({
          "--mascot-float-duration": `${Math.min(Math.max(floatDuration, 5), 7)}s`,
          "--mascot-float-delay": `${delay}s`,
        }) as CSSProperties,
      [floatDuration, delay],
    );

    const handleError = () => {
      setCandidateIndex((index) => index + 1);
    };

    if (exhausted) {
      return null;
    }

    const imageStyle: CSSProperties = {
      width: size,
      height: size,
      background: "transparent",
      filter: floating ? "drop-shadow(0 15px 30px rgba(0,0,0,0.12))" : undefined,
    };

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
        sizes={mascotImageSizes(size)}
        quality={mascotImageQuality(size)}
        draggable={false}
        onError={handleError}
        className={cn(
          "pointer-events-none relative z-30 select-none object-contain drop-shadow-2xl",
          interactive && !floating && "drop-shadow-[0_10px_28px_rgba(29,69,45,0.16)] filter",
          !animated && className,
        )}
        style={imageStyle}
      />
    );

    if (!animated) {
      return image;
    }

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "relative inline-block transform-gpu will-change-transform",
          floating ? "z-30" : "z-10",
          floating && "mascot-float",
          interactive && "mascot-interactive cursor-default",
          className,
        )}
        style={floating ? floatStyle : undefined}
      >
        {image}
      </div>
    );
  },
);

export default Mascot;
