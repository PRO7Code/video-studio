import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FramedClip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Words } from "../components/Type";
import { C, arabic, latin } from "../theme";
import { SCENES } from "../timeline";

/** Closing: the whole room in frame, the message, and the partnership lockup. */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const lock = interpolate(frame, [70, 86], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [SCENES.outro - 18, SCENES.outro], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill>
      <FramedClip
        src="clips/hall-wide.mp4"
        from={0.4}
        duration={SCENES.outro}
        segs={[{ frames: SCENES.outro, rate: 0.6 }]}
        zoom={[1.0, 1.08]}
        focus={[50, 50]}
        volume={0}
      />
      <Finish top={0.5} bottom={0.6} />
      <AbsoluteFill style={{ top: 300, padding: "0 150px 0 90px" }}>
        <Words text="من التعلّم…" delay={6} size={92} weight={300} />
        <Words text="إلى حلول حقيقية" delay={16} size={92} color={C.teal} />
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1290, padding: "0 150px 0 90px", direction: "rtl" }}>
        <Words text="ونكمل الخميس القادم" delay={44} size={46} weight={400} />
        <div
          style={{
            marginTop: 26,
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: lock,
            transform: `translateY(${(1 - lock) * 14}px)`,
          }}
        >
          <span style={{ fontFamily: latin, fontWeight: 700, fontSize: 46, color: C.white }}>Fluent</span>
          <span style={{ fontFamily: latin, fontSize: 36, color: C.teal }}>×</span>
          <span style={{ fontFamily: arabic, fontWeight: 600, fontSize: 40, color: C.white }}>أكاديمية عنان للتدريب</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: C.ink, opacity: out }} />
    </AbsoluteFill>
  );
};
