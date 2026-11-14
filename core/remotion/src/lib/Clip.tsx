import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import { useBrand, withAlpha } from "./brand";

export type Seg = { frames: number; rate: number };

type Props = {
  src: string;
  /** start time in the source, seconds */
  from: number;
  /** speed-ramp segments; defaults to a single real-time segment */
  segs?: Seg[];
  duration: number;
  /** object-position / zoom origin in % */
  focus?: [number, number];
  zoom?: [number, number];
  origin?: [number, number];
  blur?: number;
  dim?: number;
  volume?: number;
  fit?: "cover" | "contain";
};

/** Real footage with cinematic push-in, optional speed ramps, and grading. */
export const Clip: React.FC<Props> = ({
  src,
  from,
  segs,
  duration,
  focus = [50, 50],
  zoom = [1.04, 1.14],
  origin,
  blur = 0,
  dim = 0,
  volume = 0.2,
  fit = "cover",
}) => {
  const frame = useCurrentFrame();
  const sc = useBrand().colors.scrim;
  const s = interpolate(frame, [0, duration], zoom, {
    easing: Easing.bezier(0.33, 0, 0.2, 1),
    extrapolateRight: "clamp",
  });
  const segments = segs ?? [{ frames: duration, rate: 1 }];
  let srcT = from;
  let at = 0;
  const parts = segments.map((seg, i) => {
    const el = (
      <Sequence key={i} from={at} durationInFrames={seg.frames} layout="none">
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(srcT * 30)}
          playbackRate={seg.rate}
          muted={seg.rate < 0.8 || seg.rate > 1.25}
          volume={volume}
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: `${focus[0]}% ${focus[1]}%`,
          }}
        />
      </Sequence>
    );
    srcT += (seg.frames / 30) * seg.rate;
    at += seg.frames;
    return el;
  });
  const o = origin ?? focus;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: sc }}>
      <AbsoluteFill
        style={{
          transform: `scale(${s})`,
          transformOrigin: `${o[0]}% ${o[1]}%`,
          filter: `${blur ? `blur(${blur}px)` : ""} saturate(1.06) contrast(1.04)`,
        }}
      >
        {parts}
      </AbsoluteFill>
      {dim > 0 ? (
        <AbsoluteFill style={{ backgroundColor: withAlpha(sc, dim) }} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Landscape footage shown whole inside a portrait frame, over a blurred fill. */
export const FramedClip: React.FC<Omit<Props, "fit">> = (p) => (
  <AbsoluteFill>
    <Clip {...p} blur={40} dim={0.45} volume={0} zoom={[1.3, 1.4]} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: 1080,
          height: 608,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
          position: "relative",
          transform: "scale(0.9)",
        }}
      >
        <Clip {...p} fit="cover" />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
