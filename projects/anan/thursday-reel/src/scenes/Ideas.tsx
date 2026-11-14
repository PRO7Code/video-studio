import React from "react";
import { AbsoluteFill } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Kicker, Words } from "../components/Type";
import { SAFE } from "../theme";
import { SCENES } from "../timeline";

/** Act 1 — students presenting their solution paths to the group. */
export const Ideas: React.FC = () => (
  <AbsoluteFill>
    <Clip src="clips/hall-portrait.mp4" from={0.3} duration={SCENES.ideas} focus={[40, 45]} zoom={[1.02, 1.2]} volume={0.25} />
    <Finish top={0.7} bottom={0.3} />
    <AbsoluteFill style={{ padding: `${SAFE.top + 20}px ${SAFE.right}px 0 ${SAFE.left}px` }}>
      <Kicker num="01" label="عرض الأفكار" delay={4} />
      <div style={{ height: 28 }} />
      <Words text="الطالبات يعرضن" delay={10} size={84} />
      <Words text="مسارات الحل أمام المجموعة" delay={16} size={84} weight={300} />
    </AbsoluteFill>
  </AbsoluteFill>
);
