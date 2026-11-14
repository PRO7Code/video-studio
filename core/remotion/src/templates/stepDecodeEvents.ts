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

/**
 * Analysis steps get time in proportion to what there is to read (words; formula chips count 0.6 each), with a
 * 50-frame floor per step; the last step keeps the remaining time until the card leaves.
 */
export const ruleStepStarts = (rule: Phase, load: [number, number, number] = [1, 1, 1]): [number, number, number] => {
  const usable = rule.frames - 8 - 12; // 8 f lead-in, 12 f before the card leaves
  const w = load.map((x) => Math.max(0.5, x));
  const total = w[0] + w[1] + w[2];
  let d0 = Math.max(50, Math.round((usable * w[0]) / total));
  let d1 = Math.max(50, Math.round((usable * w[1]) / total));
  const over = d0 + d1 + 50 - usable;
  if (over > 0) { const k = (d0 + d1 - over) / (d0 + d1); d0 = Math.round(d0 * k); d1 = Math.round(d1 * k); }
  const a = rule.from + 8;
  return [a, a + d0, a + d0 + d1];
};

export const stepEvents = (ph: Phase[], optionCount: number, perOption = ELIMINATE_PER_OPTION, ruleLoad?: [number, number, number]): StepEvents => {
  const q = phaseAt(ph, "question"), op = phaseAt(ph, "options"), th = phaseAt(ph, "think"), rule = phaseAt(ph, "rule"), out = phaseAt(ph, "outro");
  const steps = ruleStepStarts(rule, ruleLoad);
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

/** reading load of the three analysis steps from the episode text */
export const ruleLoadOf = (rule: { clueAr?: string; titleAr: string; pattern?: string; explainAr: string }): [number, number, number] => {
  const words = (x?: string) => (x ?? "").split(/\s+/).filter(Boolean).length;
  const chips = (rule.pattern ?? "").split(/\s*(?:\+|→|->)\s*/).filter(Boolean).length;
  return [words(rule.clueAr), words(rule.titleAr) + 0.6 * chips, words(rule.explainAr)];
};

/** STEP DECODE sound kit (public/sfx/step/*, original, studio-owned): whoosh · pop · tick · strike · success · chime · tap · logo */
export const stepCues = (ev: StepEvents, outroFrom: number, formulaChipIdx: number[] = [], gain = 1): Cue[] => ([
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
] as Cue[]).map((c) => ({ ...c, volume: c.volume * gain }));
