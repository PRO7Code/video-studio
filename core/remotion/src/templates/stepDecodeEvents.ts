// Single source of truth for WHEN things happen in STEP DECODE (30-fps timebase). The template animates from these
// frames and the SFX cue sheet is built from the same frames, so sound and motion cannot drift apart (unit-tested).
import type { Cue } from "../lib/SfxTrack";
import { phaseAt, strikeFrame, ELIMINATE_PER_OPTION, type Phase } from "./stepDecodeTiming.ts";

export type StepEvents = {
  hookExit: number; // hook pushes through, question card flies in
  questionIn: number;
  stemWords: number; // first stem word; words follow every STEM_WORD_GAP frames
  optionIn: number[]; // per option index
  thinkTicks: number[]; // one per second of the countdown
  strike: number[]; // per WRONG option, in order
  reveal: number;
  ruleSteps: [number, number, number]; // clue → rule → meaning
  formulaFrom: number; // first formula chip (rule step 2), chips every FORMULA_GAP frames
  outroLines: [number, number];
  links: number;
};
export const STEM_WORD_GAP = 2.5;
export const FORMULA_GAP = 5;
export const OPTION_GAP = 8;

export const stepEvents = (ph: Phase[], optionCount: number, perOption = ELIMINATE_PER_OPTION): StepEvents => {
  const q = phaseAt(ph, "question"), op = phaseAt(ph, "options"), th = phaseAt(ph, "think"), rule = phaseAt(ph, "rule"), out = phaseAt(ph, "outro");
  const stepGap = Math.max(24, Math.floor((rule.frames - 30) / 3));
  const steps: [number, number, number] = [rule.from + 8, rule.from + 8 + stepGap, rule.from + 8 + 2 * stepGap];
  return {
    hookExit: q.from - 8,
    questionIn: q.from,
    stemWords: q.from + 8,
    optionIn: Array.from({ length: optionCount }, (_, i) => op.from + 4 + i * OPTION_GAP),
    thinkTicks: Array.from({ length: Math.max(1, Math.round(th.frames / 30)) }, (_, s) => th.from + s * 30),
    strike: Array.from({ length: Math.max(0, optionCount - 1) }, (_, k) => strikeFrame(ph, k, perOption)),
    reveal: phaseAt(ph, "reveal").from,
    ruleSteps: steps,
    formulaFrom: steps[1] + 16,
    outroLines: [out.from + 4, out.from + Math.min(36, Math.floor(out.frames / 2.5))],
    links: out.from + Math.min(52, Math.floor(out.frames / 1.8)),
  };
};

/** STEP DECODE sound kit (public/sfx/step/*, original, studio-owned): whoosh · pop · tick · strike · success · chime · tap · logo */
export const stepCues = (ev: StepEvents, outroFrom: number, formulaChipIdx: number[] = []): Cue[] => [
  { at: 0, file: "step/hit", volume: 0.5 },
  { at: Math.max(0, ev.hookExit - 4), file: "step/whoosh", volume: 0.42 },
  ...ev.optionIn.map((at, i) => ({ at, file: `step/pop${Math.min(5, i + 1)}`, volume: 0.5 })),
  ...ev.thinkTicks.map((at, i, arr) => ({ at, file: i === arr.length - 1 ? "step/tick-hi" : "step/tick", volume: 0.55 })),
  ...ev.strike.map((at) => ({ at, file: "step/strike", volume: 0.5 })),
  { at: ev.reveal, file: "step/success", volume: 0.6 },
  ...ev.ruleSteps.map((at, i) => ({ at, file: `step/chime${i + 1}`, volume: 0.42 })),
  ...formulaChipIdx.map((i) => ({ at: ev.formulaFrom + i * FORMULA_GAP, file: "step/tap", volume: 0.3 })),
  { at: Math.max(0, outroFrom - 6), file: "step/whoosh", volume: 0.34 },
  { at: ev.outroLines[1], file: "step/logo", volume: 0.5 },
];
