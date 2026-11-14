import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Chip, Words } from "../components/Type";
import { C, arabic } from "../theme";
import { SCENES } from "../timeline";

// Geometry of the real slide inside hall-wide.mp4 (1280x720 source).
const SRC_H = 720;
const K = 1920 / SRC_H; // cover scale
const CROP_X = 225; // left edge of the visible 405px-wide window
const FOCUS_X = (CROP_X / (1280 - 1080 / K)) * 100;
const ORIGIN: [number, number] = [540, 860];
const ZOOM: [number, number] = [1.05, 1.5];
// Slide title "مسارا الاستقبال والتحليل (WF-01 & WF-02)" bounding box in source px
const TITLE = { x0: 312, x1: 440, y0: 248, y1: 272 };

const map = (x: number, y: number, s: number) => {
  const X = (x - CROP_X) * K;
  const Y = y * K;
  return [ORIGIN[0] + (X - ORIGIN[0]) * s, ORIGIN[1] + (Y - ORIGIN[1]) * s];
};

/** The real slide on screen: zoom into it and annotate the workflow names. */
export const Slide: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, SCENES.slide], ZOOM, {
    easing: Easing.bezier(0.33, 0, 0.2, 1),
    extrapolateRight: "clamp",
  });
  const [x0, y0] = map(TITLE.x0, TITLE.y0, s);
  const [x1, y1] = map(TITLE.x1, TITLE.y1, s);
  const draw = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pad = 18;
  const w = x1 - x0 + pad * 2;
  const h = y1 - y0 + pad * 2;
  const perim = 2 * (w + h);
  const cardY = 1180;
  return (
    <AbsoluteFill>
      <Clip
        src="clips/hall-wide.mp4"
        from={0}
        duration={SCENES.slide}
        focus={[FOCUS_X, 50]}
        origin={[(ORIGIN[0] / 1080) * 100, (ORIGIN[1] / 1920) * 100]}
        zoom={ZOOM}
        volume={0.25}
      />
      <Finish top={0.6} bottom={0.75} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <rect
          x={x0 - pad}
          y={y0 - pad}
          width={w}
          height={h}
          rx={14}
          fill="none"
          stroke={C.teal}
          strokeWidth={4}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - draw)}
          style={{ filter: `drop-shadow(0 0 12px ${C.teal})` }}
        />
        <line
          x1={(x0 + x1) / 2}
          y1={y1 + pad}
          x2={(x0 + x1) / 2}
          y2={y1 + pad + (cardY - 30 - (y1 + pad)) * draw}
          stroke={C.teal}
          strokeWidth={3}
          strokeDasharray="8 10"
          opacity={0.9}
        />
      </svg>
      <AbsoluteFill style={{ top: 280, padding: "0 150px 0 90px", height: 300 }}>
        <Words text="خطة العمل على الشاشة" delay={4} size={72} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: cardY,
          right: 150,
          left: 90,
          direction: "rtl",
          padding: "34px 40px",
          borderRadius: 32,
          background: "rgba(8,14,32,0.78)",
          border: `1.5px solid rgba(46,230,197,0.45)`,
          opacity: interpolate(frame, [34, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ fontFamily: arabic, fontSize: 32, color: C.muted, marginBottom: 6 }}>من شريحة العرض</div>
        <div style={{ fontFamily: arabic, fontSize: 50, fontWeight: 700, color: C.white, marginBottom: 24 }}>
          مسارا الاستقبال والتحليل
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Chip delay={48} size={34}>WF-01</Chip>
          <Chip delay={53} size={34}>WF-02</Chip>
          <Chip delay={58} size={34} accent={C.cyan}>WF-03</Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};
