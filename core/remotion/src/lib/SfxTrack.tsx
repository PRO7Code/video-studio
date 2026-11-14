import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";

export type Cue = { at: number; file: string; volume: number };

/** Places each sound effect on the exact frame of its visual event. Files live in public/sfx/<file>.wav */
export const SfxTrack: React.FC<{ cues: Cue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={45} layout="none" name={`sfx:${c.file}`}>
        <Html5Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);
