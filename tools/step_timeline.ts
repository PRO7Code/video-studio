// STEP DECODE timeline sheet for any episode: scenes, motion beats, SFX cues and Arabic narration slots.
//   node tools/step_timeline.ts <props.json> [--json out.json] > timeline.md
// Everything is computed from the same model the template renders (stepDecodeTiming + stepDecodeEvents).
import fs from "node:fs";
import { stepPhases, stepTotal, phaseAt, type PhaseName } from "../core/remotion/src/templates/stepDecodeTiming.ts";
import { stepEvents, stepCues, STEM_WORD_GAP, FORMULA_GAP } from "../core/remotion/src/templates/stepDecodeEvents.ts";

const p = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const jsonOut = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
const ph = stepPhases({ wrongCount: p.options.length - 1, thinkSeconds: p.thinkSeconds, overrides: p.timing, perOption: p.perOption });
const ev = stepEvents(ph, p.options.length, p.perOption);
const chips = String(p.rule?.pattern ?? "").split(/\s*(\+|→|->)\s*/).filter((x: string) => x && x.trim());
const chipIdx = chips.map((c: string, i: number) => (c === "+" || c === "→" || c === "->" ? -1 : i)).filter((i: number) => i >= 0);
const cues = stepCues(ev, phaseAt(ph, "outro").from, chipIdx);
const fps = p.fps ?? 30;
const s = (f: number) => (f / 30).toFixed(2);
const fr = (f: number) => Math.round((f * fps) / 30);
const SCENE: Record<PhaseName, [string, string]> = {
  hook: ["Hook", "kinetic words slam in (scale 1.45→1, blur 12→0, 3 f stagger), marker sweep on ^word^, brand flash, push-through exit + blur"],
  question: ["Question", "card flies up with 3-D tilt (rotateX 22°→0) + motion blur; stem builds word-by-word; keyword underlines sweep"],
  options: ["Options", "staggered slide-in from the right (8 f apart) with overshoot + motion blur; letter badges pop"],
  think: ["Countdown", "segmented ring empties per second, number flips (scale 1.35→1), spotlight dims the edges, sheen scans the options, blank pulses"],
  eliminate: ["Eliminate", "per wrong option: shake → orange strike draws → card dims/shifts → reason chip springs in"],
  reveal: ["Reveal", "correct card grows + blue fill, check-mark draws, shockwave + 12 sparks, blank flips to the answer, others fade"],
  rule: ["Analysis", "card rises; ① clue (stem tokens boxed, *emphasis*) ② title + formula chips pop one by one ③ meaning with ^marker^"],
  outro: ["CTA", "kinetic line 1, blue pill line 2, brand links spring in"],
};
const VO_RATE = 2.3; // comfortable Arabic narration, words per second
const lines: string[] = [];
lines.push(`# STEP DECODE timeline — ${p.question?.stem ?? ""}`);
lines.push(`Render: 1080×1920 @ ${fps} fps · total ${s(stepTotal(ph))} s (${fr(stepTotal(ph))} frames) · timebase 30 f/s (frame columns @${fps})\n`);
lines.push("## Scenes");
lines.push("| # | Scene | Start s | End s | Frames @" + fps + " | Motion |");
lines.push("|---|---|---|---|---|---|");
ph.forEach((x, i) => lines.push(`| ${i + 1} | ${SCENE[x.name][0]} | ${s(x.from)} | ${s(x.from + x.frames)} | ${fr(x.from)}–${fr(x.from + x.frames)} | ${SCENE[x.name][1]} |`));
lines.push("\n## Motion beats");
const beats: [number, string][] = [
  [ev.hookExit, "hook push-through"], [ev.questionIn, "question card lands"], [ev.stemWords, `stem words every ${STEM_WORD_GAP} f`],
  ...ev.optionIn.map((f, i) => [f, `option ${"ABCDE"[i]} in`] as [number, string]),
  ...ev.thinkTicks.map((f, i) => [f, `countdown ${ev.thinkTicks.length - i}`] as [number, string]),
  ...ev.strike.map((f, k) => [f, `strike wrong #${k + 1}`] as [number, string]),
  [ev.reveal, "reveal"], ...ev.ruleSteps.map((f, i) => [f, `analysis step ${i + 1}`] as [number, string]),
  [ev.formulaFrom, `formula chips every ${FORMULA_GAP} f`], [ev.outroLines[0], "CTA line 1"], [ev.outroLines[1], "CTA line 2"], [ev.links, "links"],
];
lines.push("| s | frame @" + fps + " | beat |"); lines.push("|---|---|---|");
beats.sort((a, b) => a[0] - b[0]).forEach(([f, n]) => lines.push(`| ${s(f)} | ${fr(f)} | ${n} |`));
lines.push("\n## SFX cues (public/sfx/…)");
lines.push("| s | frame @" + fps + " | file | volume |"); lines.push("|---|---|---|---|");
cues.forEach((c) => lines.push(`| ${s(c.at)} | ${fr(c.at)} | ${c.file} | ${c.volume} |`));
lines.push("\n## Arabic narration slots (for the voice recorded later)");
lines.push("Place each line inside its slot; the builder (make_vo.py) stretches a scene if a line is longer.");
lines.push("| Scene | Slot start s | Slot end s | Max length s | ≈ words | Suggested content |"); lines.push("|---|---|---|---|---|---|");
const SUGGEST: Partial<Record<PhaseName, string>> = { hook: "the hook line", question: "\"read the sentence, watch the highlighted words\"", options: "(optional) \"four choices\"", think: "silence or \"think\"", eliminate: "one short reason per wrong option, on its strike", reveal: "\"the answer is B — had\"", rule: "clue → rule → meaning, one sentence each", outro: "follow line" };
const slots = ph.map((x) => ({ phase: x.name, from: x.from + 6, to: x.from + x.frames - 6 }));
slots.forEach((v) => lines.push(`| ${SCENE[v.phase][0]} | ${s(v.from)} | ${s(v.to)} | ${s(v.to - v.from)} | ${Math.floor(((v.to - v.from) / 30) * VO_RATE)} | ${SUGGEST[v.phase] ?? ""} |`));
console.log(lines.join("\n"));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ fps, total: stepTotal(ph) / 30, phases: ph.map((x) => ({ ...x, fromS: x.from / 30, toS: (x.from + x.frames) / 30 })), events: ev, cues: cues.map((c) => ({ ...c, t: c.at / 30 })), voSlots: slots.map((v) => ({ ...v, fromS: v.from / 30, toS: v.to / 30 })) }, null, 1));
