import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, staticFile, CalculateMetadataFunction } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { zoomBlur } from "./lib/transitions";
import { Clip, Seg } from "./lib/Clip";
import { Finish } from "./lib/Overlays";
import { Words, DevBadge } from "./lib/Type";
import { SfxTrack, Cue } from "./lib/SfxTrack";
import { C, SAFE } from "./lib/theme";

/**
 * Generic, data-driven ad: a project writes a timeline.json (scenes → clips + titles),
 * the composition renders it. Durations are in frames @30fps.
 */
export type Scene = {
  src: string; // path under public/, e.g. "projects/rimadi/gen/bar.mp4"
  from?: number; // seconds into source
  frames: number;
  segs?: Seg[];
  focus?: [number, number];
  zoom?: [number, number];
  title?: string;
  subtitle?: string;
  titlePos?: "top" | "bottom";
  badge?: boolean;
  transition?: "zoomBlur" | "fade" | "cut";
  volume?: number;
};
export type AdProps = {
  scenes: Scene[];
  music?: string;
  musicVolume?: number;
  cues?: Cue[];
  transitionFrames?: number;
};

export const totalFrames = (p: AdProps) => {
  const t = p.transitionFrames ?? 12;
  return p.scenes.reduce(
    (a, s, i) => a + s.frames - (i > 0 && (s.transition ?? "fade") !== "cut" ? t : 0),
    0,
  );
};

export const calcAdMetadata: CalculateMetadataFunction<AdProps> = ({ props }) => ({
  durationInFrames: Math.max(1, totalFrames(props)),
});

const SceneView: React.FC<{ s: Scene }> = ({ s }) => (
  <AbsoluteFill>
    <Clip src={s.src} from={s.from ?? 0} duration={s.frames} segs={s.segs} focus={s.focus} zoom={s.zoom} volume={s.volume ?? 0} />
    <Finish top={s.titlePos === "top" ? 0.6 : 0.3} bottom={s.titlePos === "top" ? 0.3 : 0.8} />
    {s.title ? (
      <AbsoluteFill
        style={{
          justifyContent: s.titlePos === "top" ? "flex-start" : "flex-end",
          padding:
            s.titlePos === "top"
              ? `${SAFE.top + 20}px ${SAFE.right}px 0 ${SAFE.left}px`
              : `0 ${SAFE.right}px ${1920 - SAFE.bottom + 40}px ${SAFE.left}px`,
        }}
      >
        {s.badge ? <DevBadge delay={4} /> : null}
        <Words text={s.title} delay={6} size={88} />
        {s.subtitle ? <Words text={s.subtitle} delay={14} size={46} weight={400} stagger={2} /> : null}
      </AbsoluteFill>
    ) : null}
  </AbsoluteFill>
);

export const AdTimeline: React.FC<AdProps> = (p) => {
  const t = p.transitionFrames ?? 12;
  const total = totalFrames(p);
  const items: React.ReactNode[] = [];
  p.scenes.forEach((s, i) => {
    if (i > 0 && (s.transition ?? "fade") !== "cut") {
      items.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={(s.transition === "zoomBlur" ? zoomBlur() : fade()) as ReturnType<typeof fade>}
          timing={linearTiming({ durationInFrames: t })}
        />,
      );
    }
    items.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.frames}>
        <SceneView s={s} />
      </TransitionSeries.Sequence>,
    );
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <TransitionSeries>{items}</TransitionSeries>
      {p.music ? (
        <Html5Audio
          src={staticFile(p.music)}
          volume={(f) => (p.musicVolume ?? 0.9) * interpolate(f, [total - 30, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {p.cues ? <SfxTrack cues={p.cues} /> : null}
    </AbsoluteFill>
  );
};
