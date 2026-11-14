import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Words } from "../components/Type";
import { C, arabic, latin } from "../theme";
import { SCENES } from "../timeline";

/** Establishing shot of the hall + series title lockup. */
export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [8, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const lock = interpolate(frame, [30, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Clip
        src="clips/room-establish.mp4"
        from={0}
        duration={SCENES.title}
        segs={[{ frames: SCENES.title, rate: 0.6 }]}
        zoom={[1.0, 1.12]}
        focus={[35, 40]}
        dim={0.25}
      />
      <Finish top={0.35} bottom={0.85} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 150px 520px 90px" }}>
        <Words text="لقاء الخميس" delay={2} size={110} />
        <Words text="الأسبوعي" delay={8} size={110} color={C.teal} />
        <div style={{ height: 6, width: 560 * line, background: C.teal, margin: "24px 0 28px auto", borderRadius: 3 }} />
        <Words text="الأسبوع الثاني · تجربة تدريبية لمدة شهر" delay={18} size={44} weight={400} stagger={2} />
        <div
          style={{
            direction: "rtl",
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: lock,
            transform: `translateY(${(1 - lock) * 16}px)`,
          }}
        >
          <span style={{ fontFamily: latin, fontWeight: 700, fontSize: 50, color: C.white, letterSpacing: -1 }}>Fluent</span>
          <span style={{ fontFamily: latin, fontSize: 40, color: C.teal }}>×</span>
          <span style={{ fontFamily: arabic, fontWeight: 600, fontSize: 44, color: C.white }}>أكاديمية عنان للتدريب</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
