// Pure timing model for the STEP DECODE template (unit-tested). Frames @30fps.
export type StepTimingInput = {
  wrongCount: number; // options that get eliminated
  thinkSeconds?: number;
  overrides?: Partial<Record<PhaseName, number>>; // frames per phase
  perOption?: number; // frames per eliminated option (default 60)
};
export type PhaseName = "hook" | "question" | "options" | "think" | "eliminate" | "reveal" | "rule" | "outro";
export type Phase = { name: PhaseName; from: number; frames: number };

// v3 "premium" defaults (frames @30, ~29 s for 4 options): 1.8 s hook, question built word-by-word, quick staggered
// options, 3 s countdown, 1.6 s per elimination, 2 s reveal, 9 s staged analysis (reading-weighted), 3.2 s CTA.
// Frames are a 30-fps timebase; a 60-fps render simply samples it twice as often. Override per episode with "timing".
export const STEP_DEFAULTS: Record<PhaseName, number> = {
  hook: 54, question: 84, options: 66, think: 90, eliminate: 0 /* computed */, reveal: 60, rule: 270, outro: 96,
};
export const ELIMINATE_PER_OPTION = 48;

export const stepPhases = ({ wrongCount, thinkSeconds, overrides, perOption }: StepTimingInput): Phase[] => {
  const len: Record<PhaseName, number> = { ...STEP_DEFAULTS };
  len.eliminate = Math.max(1, wrongCount) * Math.max(30, Math.round(perOption ?? ELIMINATE_PER_OPTION)) + 12;
  if (thinkSeconds !== undefined) len.think = Math.max(30, Math.round(thinkSeconds * 30));
  for (const [k, v] of Object.entries(overrides ?? {})) if (typeof v === "number" && v > 0) len[k as PhaseName] = Math.round(v);
  const order: PhaseName[] = ["hook", "question", "options", "think", "eliminate", "reveal", "rule", "outro"];
  let at = 0;
  return order.map((name) => { const p = { name, from: at, frames: len[name] }; at += len[name]; return p; });
};
export const stepTotal = (phases: Phase[]) => phases.reduce((a, p) => a + p.frames, 0);
export const phaseAt = (phases: Phase[], name: PhaseName) => phases.find((p) => p.name === name)!;

/** frame at which the k-th wrong option is struck */
export const strikeFrame = (phases: Phase[], k: number, perOption = ELIMINATE_PER_OPTION) =>
  phaseAt(phases, "eliminate").from + 8 + k * Math.max(30, Math.round(perOption));
