"use client";
import { cn } from "@/lib/utils";
import React from "react";

export const NoiseBackground = ({ children, className, gradientColors }: any) => {
  const gradient = gradientColors
    ? `linear-gradient(45deg, ${gradientColors.join(", ")})`
    : "linear-gradient(45deg, #ff6496, #6496ff)";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-[2px]", className)} style={{ background: gradient }}>
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
      <div className="relative z-10 h-full w-full rounded-2xl bg-white/80 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
};