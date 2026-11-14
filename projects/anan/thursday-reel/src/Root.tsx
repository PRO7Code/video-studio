import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { TOTAL, FPS } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition id="AnanReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
