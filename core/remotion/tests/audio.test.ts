import { test } from "node:test";
import assert from "node:assert/strict";
import { musicDuck, duckGain, transitionCue, typingCues, popCue } from "../src/lib/audio.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("no ducks: full volume until the fade, silent at the end", () => {
  const v = musicDuck({ total: 300 });
  close(v(0), 1); close(v(269), 1); close(v(285), 0.5); close(v(300), 0); close(v(400), 0);
});
test("single duck ramps 12 frames down/up and holds the level", () => {
  const v = musicDuck({ total: 1000, ducks: [{ from: 100, to: 200, level: 0.4 }] });
  close(v(99), 1); close(v(106), 0.7); close(v(112), 0.4); close(v(150), 0.4); close(v(188), 0.4); close(v(194), 0.7); close(v(200), 1);
});
test("overlapping ducks take the deepest level (no multiplication)", () => {
  const v = musicDuck({ total: 1000, ducks: [{ from: 100, to: 300, level: 0.5 }, { from: 200, to: 400, level: 0.3 }] });
  close(v(150), 0.5); close(v(250), 0.3); close(v(350), 0.3); close(v(420), 1);
});
test("short duck (< 2 × ramp) does not throw and still dips", () => {
  assert.doesNotThrow(() => duckGain(5, { from: 0, to: 10 }));
  close(duckGain(5, { from: 0, to: 10, level: 0.45 }), 0.45);
  close(duckGain(0, { from: 0, to: 10 }), 1);
});
test("zero-length and reversed ducks are safe", () => {
  close(duckGain(50, { from: 50, to: 50 }), 1);
  close(duckGain(150, { from: 200, to: 100, level: 0.5 }), 0.5);
});
test("level is clamped to 0..1", () => {
  close(duckGain(50, { from: 0, to: 100, level: 3 }), 1);
  close(duckGain(50, { from: 0, to: 100, level: -1 }), 0);
});
test("very short composition: fade never exceeds total, no throw", () => {
  const v = musicDuck({ total: 10, fadeOut: 30 });
  close(v(0), 1); close(v(5), 0.5); close(v(10), 0);
  const w = musicDuck({ total: 10, fadeOut: 0 });
  close(w(9), 1); close(w(10), 0);
});
test("base volume scales the whole curve", () => {
  close(musicDuck({ total: 100, base: 0.8 })(10), 0.8);
});
test("transition cues lead the cut and never go negative", () => {
  assert.equal(transitionCue(100).at, 94);
  assert.equal(transitionCue(100, "fade").at, 95);
  assert.equal(transitionCue(3).at, 0);
  assert.equal(popCue(-5).at, 0);
});
test("typing cues: one per char, spread over the window, empty for 0 chars", () => {
  const c = typingCues(10, 4, 8);
  assert.deepEqual(c.map((x) => x.at), [10, 12, 14, 16]);
  assert.deepEqual(c.map((x) => x.file), ["key1", "key2", "key3", "key4"]);
  assert.deepEqual(typingCues(0, 0, 10), []);
});
