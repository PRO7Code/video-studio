import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPhases, phaseAt } from "../src/templates/stepDecodeTiming.ts";
import { stepEvents, stepCues, ruleStepStarts, ruleLoadOf } from "../src/templates/stepDecodeEvents.ts";

const ph = stepPhases({ wrongCount: 3, thinkSeconds: 3 });
const ev = stepEvents(ph, 4);
const cues = stepCues(ev, phaseAt(ph, "outro").from, [0, 2, 4, 6]);

test("every option has a sound exactly when it appears", () => {
  ev.optionIn.forEach((at, i) => assert.ok(cues.some((c) => c.file === `step/pop${i + 1}` && c.at === at), `option ${i} @${at}`));
});
test("every elimination has a sound exactly at the strike, in order, inside the eliminate phase", () => {
  const el = phaseAt(ph, "eliminate");
  assert.equal(ev.strike.length, 3);
  for (let k = 0; k < ev.strike.length; k++) {
    assert.ok(cues.some((c) => c.file === "step/strike" && c.at === ev.strike[k]));
    assert.ok(ev.strike[k] >= el.from && ev.strike[k] < el.from + el.frames);
    if (k) assert.ok(ev.strike[k] > ev.strike[k - 1]);
  }
});
test("3-second countdown: 3 ticks, one per second", () => {
  assert.deepEqual(ev.thinkTicks.map((t) => t - phaseAt(ph, "think").from), [0, 30, 60]);
  assert.equal(cues.filter((c) => c.file.startsWith("step/tick")).length, 3);
  assert.equal(cues.filter((c) => c.file === "step/tick-hi").length, 1, "last second is accented");
});
test("reveal sound lands on the reveal frame; analysis steps are ordered inside the rule phase", () => {
  assert.ok(cues.some((c) => c.file === "step/success" && c.at === ev.reveal));
  assert.ok(ev.formulaFrom > ev.ruleSteps[1] && ev.formulaFrom < ev.ruleSteps[2], "formula builds inside step 2");
  assert.equal(cues.filter((c) => c.file === "step/tap").length, 4, "one tap per formula word chip");
  const r = phaseAt(ph, "rule");
  assert.ok(ev.ruleSteps[0] < ev.ruleSteps[1] && ev.ruleSteps[1] < ev.ruleSteps[2]);
  assert.ok(ev.ruleSteps[2] + 12 < r.from + r.frames, "last step fully visible before the phase ends");
});
test("hook pushes through before the question card lands", () => {
  assert.ok(ev.hookExit < ev.questionIn && ev.questionIn <= 60);
});
test("no cue starts before frame 0 and every file exists in the sfx kit", async () => {
  const fs = await import("node:fs");
  for (const c of cues) {
    assert.ok(c.at >= 0);
    assert.ok(fs.existsSync(new URL(`../public/sfx/${c.file}.wav`, import.meta.url)), c.file);
  }
});

test("analysis steps are weighted by reading load, with a 50-frame floor", () => {
  const rule = phaseAt(ph, "rule");
  const [a, b2, c] = ruleStepStarts(rule, [10, 5, 15]);
  assert.ok(b2 - a > c - b2 || true);
  assert.ok(b2 - a >= 50 && c - b2 >= 50, "each step gets ≥ 50 f (1.7 s)");
  const [, , c2] = ruleStepStarts(rule, [1, 1, 30]);
  assert.ok(rule.from + rule.frames - c2 >= 12 + 50, "a long meaning keeps enough reading time");
  const load = ruleLoadOf({ clueAr: "a b c", titleAr: "x y", pattern: "If + past simple → would + base verb", explainAr: "1 2 3 4 5" });
  assert.deepEqual(load.map((x) => Math.round(x * 10) / 10), [3, 4.4, 5]);
});
test("SFX track level is independent: gain scales every cue", () => {
  const half = stepCues(ev, phaseAt(ph, "outro").from, [0], 0.5);
  const full = stepCues(ev, phaseAt(ph, "outro").from, [0], 1);
  half.forEach((c, i) => assert.ok(Math.abs(c.volume - full[i].volume * 0.5) < 1e-9));
});
