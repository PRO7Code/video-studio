import React from "react";
import { Composition, staticFile } from "remotion";
import { AdTimeline, AdProps, calcAdMetadata } from "./AdTimeline";
import { LookTest, LookCompare } from "./LookTest";

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
  </>
);
void staticFile;
