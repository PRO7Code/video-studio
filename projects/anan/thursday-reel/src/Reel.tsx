import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { CUES } from "./sfx";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { zoomBlur } from "./components/transitions";
import { Chapters } from "./components/Chapters";
import { SCENES, START, T, TOTAL } from "./timeline";
import { C } from "./theme";
import { Hook } from "./scenes/Hook";
import { Title } from "./scenes/Title";
import { Ideas } from "./scenes/Ideas";
import { Slide } from "./scenes/Slide";
import { Mentor } from "./scenes/Mentor";
import { Discussion } from "./scenes/Discussion";
import { Tech } from "./scenes/Tech";
import { Outro } from "./scenes/Outro";

const timing = linearTiming({ durationInFrames: T });

/** Music ducks under the real room sound during the group-discussion moment. */
const musicVolume = (f: number) => {
  const duck = interpolate(
    f,
    [START.discussion, START.discussion + 12, START.tech - 14, START.tech],
    [1, 0.45, 0.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const tail = interpolate(f, [TOTAL - 30, TOTAL], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return 1.0 * duck * tail;
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.ink }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={zoomBlur()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.title}>
        <Title />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={zoomBlur()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.ideas}>
        <Ideas />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.slide}>
        <Slide />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={zoomBlur()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.mentor}>
        <Mentor />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.discussion}>
        <Discussion />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={zoomBlur()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.tech}>
        <Tech />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.outro}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Chapters />
    <Html5Audio src={staticFile("audio/music.wav")} volume={musicVolume} />
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={40} layout="none" name={`sfx:${c.file}`}>
        <Html5Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
