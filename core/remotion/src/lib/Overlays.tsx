import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";
import { useBrand, withAlpha } from "./brand";

/** Cinematic finishing: vignette, top/bottom gradients for legibility, animated grain. */
export const Finish: React.FC<{ top?: number; bottom?: number }> = ({
  top = 0.55,
  bottom = 0.65,
}) => {
  const frame = useCurrentFrame();
  const sc = useBrand().colors.scrim;
  const seed = Math.floor(frame / 2) % 12;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${withAlpha(sc, top)} 0%, ${withAlpha(sc, 0)} 32%, ${withAlpha(sc, 0)} 58%, ${withAlpha(sc, bottom)} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <svg
        width="1080"
        height="1920"
        style={{
          position: "absolute",
          opacity: 0.07,
          mixBlendMode: "overlay",
          transform: `translate(${(random(seed) - 0.5) * 20}px, ${(random(seed + 1) - 0.5) * 20}px)`,
        }}
      >
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
