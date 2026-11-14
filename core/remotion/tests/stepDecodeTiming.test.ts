import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPhases, stepTotal, phaseAt } from "../src/templates/stepDecodeTiming.ts";

test("4 options (3 wrong) = 28.5 s (inside the 20–30 s target), phases contiguous", () => {
  const ph = stepPhases({ wrongCount: 3, thinkSeconds: 3 });
  assert.equal(stepTotal(ph), 855);
  assert.ok(stepTotal(ph) / 30 >= 20 && stepTotal(ph) / 30 <= 30);
  for (let i = 1; i < ph.length; i++) assert.equal(ph[i].from, ph[i - 1].from + ph[i - 1].frames);
  assert.equal(phaseAt(ph, "eliminate").frames, 174);
  assert.ok(phaseAt(ph, "question").from <= 60, "question must be on screen within 2 s");
});
test("think time follows thinkSeconds, minimum 1 s", () => {
  assert.equal(phaseAt(stepPhases({ wrongCount: 3, thinkSeconds: 5 }), "think").frames, 150);
  assert.equal(phaseAt(stepPhases({ wrongCount: 3, thinkSeconds: 0 }), "think").frames, 30);
});
test("overrides change only the named phase; invalid values ignored", () => {
  const ph = stepPhases({ wrongCount: 1, overrides: { rule: 240, hook: -5 } });
  assert.equal(phaseAt(ph, "rule").frames, 240);
  assert.equal(phaseAt(ph, "hook").frames, 60);
  assert.equal(phaseAt(ph, "eliminate").frames, 66);
});
