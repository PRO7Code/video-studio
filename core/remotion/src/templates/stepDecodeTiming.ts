// Pure timing model for the STEP DECODE template (unit-tested). Frames @30fps.
export type StepTimingInput = {
  wrongCount: number; // options that get eliminated
  thinkSeconds?: number;
  overrides?: Partial<Record<PhaseName, number>>; // frames per phase
};
export type PhaseName = "hook" | "question" | "options" | "think" | "eliminate" | "reveal" | "rule" | "outro";
export type Phase = { name: PhaseName; from: number; frames: number };

export const STEP_DEFAULTS: Record<PhaseName, number> = {
  hook: 75, question: 165, options: 105, think: 90, eliminate: 0 /* computed */, reveal: 90, rule: 150, outro: 75,
};
export const ELIMINATE_PER_OPTION = 60;

export const stepPhases = ({ wrongCount, thinkSeconds, overrides }: StepTimingInput): Phase[] => {
  const len: Record<PhaseName, number> = { ...STEP_DEFAULTS };
  len.eliminate = Math.max(1, wrongCount) * ELIMINATE_PER_OPTION + 15;
  if (thinkSeconds !== undefined) len.think = Math.max(30, Math.round(thinkSeconds * 30));
  for (const [k, v] of Object.entries(overrides ?? {})) if (typeof v === "number" && v > 0) len[k as PhaseName] = Math.round(v);
  const order: PhaseName[] = ["hook", "question", "options", "think", "eliminate", "reveal", "rule", "outro"];
  let at = 0;
  return order.map((name) => { const p = { name, from: at, frames: len[name] }; at += len[name]; return p; });
};
export const stepTotal = (phases: Phase[]) => phases.reduce((a, p) => a + p.frames, 0);
export const phaseAt = (phases: Phase[], name: PhaseName) => phases.find((p) => p.name === name)!;
