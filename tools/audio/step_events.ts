// Export the STEP DECODE timeline (phases + event frames) of an episode props file as JSON, for audio tools.
//   node tools/audio/step_events.ts projects/.../out/<slug>.props.json > events.json
import fs from "node:fs";
import { stepPhases, stepTotal, phaseAt } from "../../core/remotion/src/templates/stepDecodeTiming.ts";
import { stepEvents, ruleLoadOf } from "../../core/remotion/src/templates/stepDecodeEvents.ts";
const p = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const ph = stepPhases({ wrongCount: p.options.length - 1, thinkSeconds: p.thinkSeconds, overrides: p.timing, perOption: p.perOption });
const ev = stepEvents(ph, p.options.length, p.perOption, ruleLoadOf(p.rule));
const s = (f: number) => +(f / 30).toFixed(4);
console.log(JSON.stringify({
  fps: 30, total: s(stepTotal(ph)),
  phases: Object.fromEntries(ph.map((x) => [x.name, { from: s(x.from), to: s(x.from + x.frames) }])),
  questionIn: s(ev.questionIn), optionIn: ev.optionIn.map(s), thinkTicks: ev.thinkTicks.map(s), strike: ev.strike.map(s),
  reveal: s(ev.reveal), ruleSteps: ev.ruleSteps.map(s), outroLines: ev.outroLines.map(s), outroFrom: s(phaseAt(ph, "outro").from),
}, null, 1));
