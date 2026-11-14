import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";

/** Cinematic finishing: vignette, top/bottom gradients for legibility, animated grain. */
export const Finish: React.FC<{ top?: number; bottom?: number }> = ({
  top = 0.55,
  bottom = 0.65,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 12;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(7,12,24,${top}) 0%, rgba(7,12,24,0) 32%, rgba(7,12,24,0) 58%, rgba(7,12,24,${bottom}) 100%)`,
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
