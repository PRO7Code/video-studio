import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPhases, phaseAt } from "../src/templates/stepDecodeTiming.ts";
import { stepEvents, stepCues } from "../src/templates/stepDecodeEvents.ts";

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
