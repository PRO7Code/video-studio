import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Words, DevBadge } from "../components/Type";
import { SAFE } from "../theme";
import { SCENES } from "../timeline";

/** 0–3s: a student presenting at the screen, speed-ramped pull-back (real-time → slow-mo). */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 6], [0.9, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Clip
        src="clips/hall-pan.mp4"
        from={1.0}
        duration={SCENES.hook}
        segs={[
          { frames: 30, rate: 1.0 },
          { frames: 66, rate: 0.5 },
        ]}
        focus={[56, 50]}
        origin={[62, 55]}
        zoom={[1.4, 1.15]}
        volume={0.15}
      />
      <Finish top={0.35} bottom={0.9} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: `0 ${SAFE.right}px ${1920 - SAFE.bottom + 40}px ${SAFE.left}px` }}>
        <DevBadge delay={4} />
        <div style={{ height: 34 }} />
        <Words text="نبني" delay={2} size={96} weight={400} />
        <Words text="AI_Agent" delay={7} size={170} />
        <Words text="لمشكلة حقيقية." delay={14} size={96} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};
