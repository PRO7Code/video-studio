import React from "react";
import { AbsoluteFill } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Chip, Words } from "../components/Type";
import { C, arabic } from "../theme";
import { SCENES } from "../timeline";

/** Group interaction: handheld pan through the room, ramped slow → fast → slow. */
export const Discussion: React.FC = () => (
  <AbsoluteFill>
    <Clip
      src="clips/hall-pan.mp4"
      from={0.3}
      duration={SCENES.discussion}
      segs={[
        { frames: 45, rate: 0.5 },
        { frames: 45, rate: 1.8 },
        { frames: 60, rate: 0.6 },
      ]}
      focus={[42, 50]}
      zoom={[1.08, 1.2]}
      volume={0.5}
    />
    <Finish top={0.65} bottom={0.75} />
    <AbsoluteFill style={{ top: 290, padding: "0 150px 0 90px" }}>
      <Words text="أسئلة · ملاحظات · تحسينات" delay={4} size={66} stagger={5} />
    </AbsoluteFill>
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 150px 500px 90px" }}>
      <Words text="عمل جماعي" delay={40} size={110} color={C.teal} />
      <div style={{ height: 10 }} />
      <Words text="على مشكلات حقيقية تواجه" delay={56} size={46} weight={400} stagger={3} />
      <div style={{ direction: "rtl", display: "flex", gap: 16, marginTop: 22 }}>
        <Chip delay={68} size={36}>
          <span style={{ fontFamily: arabic, fontWeight: 600 }}>الشركات</span>
        </Chip>
        <Chip delay={74} size={36} accent={C.cyan}>
          <span style={{ fontFamily: arabic, fontWeight: 600 }}>الجمعيات الخيرية</span>
        </Chip>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
