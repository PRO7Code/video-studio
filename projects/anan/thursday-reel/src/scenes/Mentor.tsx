import React from "react";
import { AbsoluteFill } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Kicker, Words } from "../components/Type";
import { SAFE } from "../theme";
import { SCENES } from "../timeline";

/** Act 2 opener — the facilitator's tablet (Anan Academy) at the discussion table. */
export const Mentor: React.FC = () => (
  <AbsoluteFill>
    <Clip
      src="clips/presenter.mp4"
      from={0}
      duration={SCENES.mentor}
      segs={[{ frames: SCENES.mentor, rate: 0.9 }]}
      focus={[50, 50]}
      origin={[30, 45]}
      zoom={[1.18, 1.04]}
      volume={0.3}
    />
    <Finish top={0.7} bottom={0.4} />
    <AbsoluteFill style={{ padding: `${SAFE.top + 20}px ${SAFE.right}px 0 ${SAFE.left}px` }}>
      <Kicker num="02" label="النقاش" delay={2} />
      <div style={{ height: 28 }} />
      <Words text="توجيه ومتابعة" delay={6} size={84} />
      <Words text="في كل خطوة" delay={11} size={84} weight={300} />
    </AbsoluteFill>
  </AbsoluteFill>
);
