import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPhases, phaseAt } from "../src/templates/stepDecodeTiming.ts";
import { stepEvents, stepCues } from "../src/templates/stepDecodeEvents.ts";

const ph = stepPhases({ wrongCount: 3, thinkSeconds: 3 });
const ev = stepEvents(ph, 4);
const cues = stepCues(ev, phaseAt(ph, "outro").from);

test("every option has a sound exactly when it appears", () => {
  for (const at of ev.optionIn) assert.ok(cues.some((c) => c.file === "ui-select" && c.at === at), `option @${at}`);
});
test("every elimination has a sound exactly at the strike, in order, inside the eliminate phase", () => {
  const el = phaseAt(ph, "eliminate");
  assert.equal(ev.strike.length, 3);
  for (let k = 0; k < ev.strike.length; k++) {
    assert.ok(cues.some((c) => c.file === "ui-uncheck" && c.at === ev.strike[k]));
    assert.ok(ev.strike[k] >= el.from && ev.strike[k] < el.from + el.frames);
    if (k) assert.ok(ev.strike[k] > ev.strike[k - 1]);
  }
});
test("3-second countdown: 3 ticks, one per second", () => {
  assert.deepEqual(ev.thinkTicks.map((t) => t - phaseAt(ph, "think").from), [0, 30, 60]);
  assert.equal(cues.filter((c) => c.file === "ui-progress-step").length, 3);
});
test("reveal sound lands on the reveal frame; analysis steps are ordered inside the rule phase", () => {
  assert.ok(cues.some((c) => c.file === "ui-success" && c.at === ev.reveal));
  const r = phaseAt(ph, "rule");
  assert.ok(ev.ruleSteps[0] < ev.ruleSteps[1] && ev.ruleSteps[1] < ev.ruleSteps[2]);
  assert.ok(ev.ruleSteps[2] + 12 < r.from + r.frames, "last step fully visible before the phase ends");
});
test("no cue starts before frame 0 and every file exists in the sfx kit", async () => {
  const fs = await import("node:fs");
  for (const c of cues) {
    assert.ok(c.at >= 0);
    assert.ok(fs.existsSync(new URL(`../public/sfx/${c.file}.wav`, import.meta.url)), c.file);
  }
});
