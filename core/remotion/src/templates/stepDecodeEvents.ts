// Single source of truth for WHEN things happen in STEP DECODE: the template animates from these frames and the
// SFX cue sheet is built from the same frames, so sound and motion cannot drift apart (unit-tested).
import type { Cue } from "../lib/SfxTrack";
import { phaseAt, strikeFrame, ELIMINATE_PER_OPTION, type Phase } from "./stepDecodeTiming.ts";

export type StepEvents = {
  questionIn: number;
  optionIn: number[]; // per option index
  thinkTicks: number[]; // one per second of the countdown
  strike: number[]; // per WRONG option, in order
  reveal: number;
  ruleSteps: [number, number, number]; // clue → rule → meaning
  outroLines: [number, number];
};

export const stepEvents = (ph: Phase[], optionCount: number, perOption = ELIMINATE_PER_OPTION): StepEvents => {
  const op = phaseAt(ph, "options"), th = phaseAt(ph, "think"), rule = phaseAt(ph, "rule"), out = phaseAt(ph, "outro");
  const stepGap = Math.max(20, Math.floor((rule.frames - 30) / 3));
  return {
    questionIn: phaseAt(ph, "question").from,
    optionIn: Array.from({ length: optionCount }, (_, i) => op.from + 6 + i * 10),
    thinkTicks: Array.from({ length: Math.max(1, Math.round(th.frames / 30)) }, (_, s) => th.from + s * 30),
    strike: Array.from({ length: Math.max(0, optionCount - 1) }, (_, k) => strikeFrame(ph, k, perOption)),
    reveal: phaseAt(ph, "reveal").from,
    ruleSteps: [rule.from + 6, rule.from + 6 + stepGap, rule.from + 6 + 2 * stepGap],
    outroLines: [out.from + 4, out.from + Math.min(45, Math.floor(out.frames / 2))],
  };
};

/** light, realistic UI sounds (uisfx soft pack, CC0) + soft whooshes on the two big moves */
export const stepCues = (ev: StepEvents, outroFrom: number): Cue[] => [
  { at: 0, file: "whoosh-soft", volume: 0.22 },
  { at: Math.max(0, ev.questionIn - 5), file: "whoosh-soft", volume: 0.24 },
  ...ev.optionIn.map((at) => ({ at, file: "ui-select", volume: 0.32 })),
  ...ev.thinkTicks.map((at) => ({ at, file: "ui-progress-step", volume: 0.36 })),
  ...ev.strike.map((at) => ({ at, file: "ui-uncheck", volume: 0.34 })),
  { at: ev.reveal, file: "ui-success", volume: 0.42 },
  ...ev.ruleSteps.map((at) => ({ at, file: "ui-open", volume: 0.24 })),
  { at: Math.max(0, outroFrom - 5), file: "whoosh-soft", volume: 0.2 },
  { at: ev.outroLines[1], file: "ui-complete", volume: 0.26 },
];
