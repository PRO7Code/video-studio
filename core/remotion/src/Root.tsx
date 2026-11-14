import React from "react";
import { Composition, staticFile } from "remotion";
import { AdTimeline, AdProps, calcAdMetadata } from "./AdTimeline";
import { LookTest, LookCompare } from "./LookTest";
import { Showcase } from "./Showcase";
import { StepDecode, calcStepMetadata, type StepDecodeProps } from "./templates/StepDecode";
import stepSample from "../../../projects/lef-academy/step-decode/episodes/sample-second-conditional.json";
import { BRAND_IDS } from "./lib/brand";

// Each project registers a composition from its timeline.json (copied to public/projects/<name>/).
// Example placeholder; replace scenes with real/generated clips before rendering.
const placeholder: AdProps = {
  scenes: [],
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Ad"
      component={AdTimeline}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1}
      defaultProps={placeholder}
      calculateMetadata={calcAdMetadata}
    />
    {/* Rimadi Lounge – qatayef box: 5 s environment test (files go in public/projects/rimadi/, git-ignored) */}
    <Composition
      id="RimadiLookTest"
      component={LookTest}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={150}
      defaultProps={{
        segFrames: 50,
        wipeFrames: 14,
        showLabels: true,
        looks: [
          { src: "projects/rimadi/locked/bar.mp4", label: "جلسة بر شتوية" },
          { src: "projects/rimadi/locked/majlis.mp4", label: "مجلس البيت" },
          { src: "projects/rimadi/locked/istiraha.mp4", label: "الاستراحة" },
        ],
      }}
    />
    <Composition
      id="RimadiLookCompare"
      component={LookCompare}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={150}
      defaultProps={{
        original: "projects/rimadi/source/test.mp4",
        looks: [
          { src: "projects/rimadi/locked/bar.mp4", label: "بر" },
          { src: "projects/rimadi/locked/majlis.mp4", label: "مجلس" },
          { src: "projects/rimadi/locked/istiraha.mp4", label: "استراحة" },
        ],
      }}
    />
    {/* LEF Academy – STEP DECODE question breakdown; render any episode with --props=<episode.json> */}
    <Composition id="StepDecode" component={StepDecode} width={1080} height={1920} fps={30} durationInFrames={1}
      defaultProps={stepSample as StepDecodeProps} calculateMetadata={calcStepMetadata} />
    {BRAND_IDS.map((id) => (
      <Composition key={id} id={`Showcase-${id}`} component={Showcase} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{ brand: id }} />
    ))}
  </>
);
void staticFile;
