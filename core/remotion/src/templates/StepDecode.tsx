import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing, CalculateMetadataFunction } from "remotion";
import { BrandProvider, Surface, useBrand, withAlpha, brandGradient } from "../lib/brand";
import { arabic, latin, mono, SAFE } from "../lib/theme";
import { Words, Chip } from "../lib/Type";
import { Clip } from "../lib/Clip";
import { SfxTrack } from "../lib/SfxTrack";
import { musicDuck } from "../lib/audio";
import { stepPhases, stepTotal, phaseAt, strikeFrame, ELIMINATE_PER_OPTION, type Phase, type PhaseName } from "./stepDecodeTiming";
import { stepEvents, stepCues, type StepEvents } from "./stepDecodeEvents";

/**
 * STEP DECODE – question breakdown template (LEF Academy), v2.
 * One episode JSON drives everything (projects/lef-academy/step-decode/episodes/*.json):
 * hook → question → options → 3 s countdown → sequential elimination with reasons → reveal → 3-step analysis
 * (clue → rule → meaning) → two-line CTA. Text-only by default; voice-over segments are optional and the music ducks
 * under them. Timing, sounds and animation all come from stepDecodeEvents (one source of truth).
 */
export type StepOption = { text: string; whyAr?: string };
export type VoSegment = { src: string; phase: PhaseName; option?: number; offset?: number; frames: number };
export type StepDecodeProps = {
  brand?: string;
  skill: string; // e.g. "Grammar"
  skillAr: string; // e.g. "قواعد"
  hookAr: string; // ≤ 8 words; Latin terms get the brand gradient, glue multi-word terms with "_"
  question: { stem: string; blank?: string; highlight?: string[] }; // blank marker in stem, default "___"
  options: StepOption[]; // 2–5
  correct: number; // index into options
  rule: {
    titleAr: string; // e.g. "الجملة الشرطية الثانية"
    pattern?: string; // e.g. "If + past simple → would + base verb"
    explainAr: string; // meaning, one sentence
    clueAr?: string; // how to spot the pattern, one sentence
    clueTokens?: string[]; // words in the stem that reveal the pattern (highlighted during analysis)
  };
  thinkSeconds?: number;
  ctaAr: string; // line 1
  ctaSubAr?: string | null; // line 2
  handle?: string | null; // only real, approved handles
  sampleLabelAr?: string | null; // e.g. "سؤال تدريبي — ليس من اختبار STEP الرسمي"
  teacher?: { src: string; from?: number; volume?: number } | null;
  voiceover?: { src?: string; ducks?: { from: number; to: number }[]; segments?: VoSegment[]; volume?: number } | null;
  music?: { src: string; volume?: number } | null;
  timing?: Partial<Record<PhaseName, number>>;
  perOption?: number; // frames per eliminated option
};

const LETTERS = ["A", "B", "C", "D", "E"];
const phasesOf = (p: StepDecodeProps) =>
  stepPhases({ wrongCount: p.options.length - 1, thinkSeconds: p.thinkSeconds, overrides: p.timing, perOption: p.perOption });

/** absolute start frame of a voice segment */
export const segmentStart = (ph: Phase[], s: VoSegment, perOption?: number) =>
  s.phase === "eliminate" && s.option !== undefined
    ? strikeFrame(ph, s.option, perOption ?? ELIMINATE_PER_OPTION) + (s.offset ?? 0)
    : phaseAt(ph, s.phase).from + (s.offset ?? 6);

export const calcStepMetadata: CalculateMetadataFunction<StepDecodeProps> = ({ props }) => ({
  durationInFrames: stepTotal(phasesOf(props)),
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);
const norm = (w: string) => w.replace(/[^A-Za-z']/g, "").toLowerCase();

// layout (1080×1920, inside the safe zone)
const CARD_TOP = 290;
const OPT_TOP = 700;
const OPT_STEP = 168;
const SIDE = { left: SAFE.left - 20, right: SAFE.right - 70 };

const Wordmark: React.FC = () => {
  const b = useBrand();
  return (
    <div style={{ position: "absolute", top: 180, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14, fontFamily: latin, fontWeight: 700, fontSize: 36, letterSpacing: 6 }}>
      <span style={{ color: b.colors.primary }}>STEP</span>
      <span style={{ color: b.colors.secondary }}>DECODE</span>
    </div>
  );
};

const Hook: React.FC<{ p: StepDecodeProps; ph: Phase[] }> = ({ p, ph }) => {
  const f = useCurrentFrame();
  const b = useBrand();
  const h = phaseAt(ph, "hook");
  const punch = interpolate(f, [0, 8, 16], [1.12, 0.98, 1], { ...clamp, easing: ease });
  const out = interpolate(f, [h.frames - 10, h.frames], [1, 0], clamp);
  const lift = interpolate(f, [h.frames - 10, h.frames], [0, -80], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px`, opacity: out, transform: `translateY(${lift}px) scale(${punch})` }}>
      <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 28 }}>
        <Chip delay={2} size={32}>{p.skill}</Chip>
        <Chip delay={5} size={32} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
      </div>
      <Words text={p.hookAr} delay={1} size={104} stagger={3} lineHeight={1.3} />
    </AbsoluteFill>
  );
};

const Stem: React.FC<{ p: StepDecodeProps; ph: Phase[]; ev: StepEvents }> = ({ p, ph, ev }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const q = phaseAt(ph, "question");
  const marker = p.question.blank ?? "___";
  const filled = interpolate(f, [ev.reveal + 4, ev.reveal + 16], [0, 1], { ...clamp, easing: ease });
  const hl = new Set((p.question.highlight ?? []).map((w) => w.toLowerCase()));
  const clue = new Set((p.rule.clueTokens ?? []).map((w) => w.toLowerCase()));
  const clueOn = interpolate(f, [ev.ruleSteps[0], ev.ruleSteps[0] + 12], [0, 1], { ...clamp, easing: ease });
  const answer = p.options[p.correct]?.text ?? "";
  return (
    <div style={{ direction: "ltr", fontFamily: latin, fontWeight: 500, fontSize: 72, lineHeight: 1.32, color: b.colors.text, display: "flex", flexWrap: "wrap", columnGap: 18, rowGap: 6 }}>
      {p.question.stem.split(" ").map((w, i) => {
        if (w.includes(marker)) {
          const rest = w.replace(marker, "");
          return (
            <span key={i} style={{ position: "relative", display: "inline-block" }}>
              <span style={{ display: "inline-block", minWidth: 170, textAlign: "center", position: "relative" }}>
                <span style={{ opacity: 1 - filled, color: b.colors.secondary, letterSpacing: 2 }}>_____</span>
                <span style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: filled, color: b.colors.primary, fontWeight: 700, transform: `scale(${0.7 + 0.3 * filled})` }}>{answer}</span>
              </span>
              {rest}
            </span>
          );
        }
        const k = norm(w);
        const ul = hl.has(k) ? interpolate(f, [q.from + 22 + i * 2, q.from + 38 + i * 2], [0, 1], clamp) : 0;
        const isClue = clue.has(k) ? clueOn : 0;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 6px", margin: "0 -6px", borderRadius: 12,
            background: withAlpha(b.colors.primary, 0.14 * isClue), boxShadow: isClue > 0 ? `inset 0 0 0 3px ${withAlpha(b.colors.primary, 0.6 * isClue)}` : "none" }}>
            {w}
            <span style={{ position: "absolute", left: 6, bottom: 6, height: 7, width: `calc((100% - 12px) * ${ul * (1 - isClue)})`, borderRadius: 4, background: withAlpha(b.colors.secondary, 0.6) }} />
          </span>
        );
      })}
    </div>
  );
};

const QuestionCard: React.FC<{ p: StepDecodeProps; ph: Phase[]; ev: StepEvents }> = ({ p, ph, ev }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const a = interpolate(f, [ev.questionIn, ev.questionIn + 14], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", top: CARD_TOP, left: SIDE.left, right: SIDE.right, opacity: a, transform: `translateY(${(1 - a) * 120}px)`,
      background: b.colors.surface, borderRadius: 40, padding: "38px 44px 44px", boxShadow: `0 26px 70px ${withAlpha(b.colors.primary, 0.16)}`, border: `2px solid ${withAlpha(b.colors.primary, 0.16)}` }}>
      <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 20 }}>
        <Chip delay={ev.questionIn + 4} size={28}>{p.skill}</Chip>
        <Chip delay={ev.questionIn + 7} size={28} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
      </div>
      <Stem p={p} ph={ph} ev={ev} />
    </div>
  );
};

const OptionRow: React.FC<{ p: StepDecodeProps; ev: StepEvents; i: number; k: number }> = ({ p, ev, i, k }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame: f - ev.optionIn[i], fps, config: { damping: 18, stiffness: 190 } });
  const isCorrect = i === p.correct;
  const at = isCorrect ? Number.MAX_SAFE_INTEGER : ev.strike[k];
  const strike = isCorrect ? 0 : interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: ease });
  const why = isCorrect ? 0 : interpolate(f, [at + 6, at + 16], [0, 1], { ...clamp, easing: ease });
  const win = isCorrect ? spring({ frame: f - ev.reveal, fps, config: { damping: 12, stiffness: 150 } }) : 0;
  const ok = isCorrect && win > 0.5;
  return (
    <div style={{ position: "absolute", top: OPT_TOP + i * OPT_STEP, left: SIDE.left, right: SIDE.right, opacity: inP * (1 - strike * 0.5),
      transform: `translateX(${(1 - inP) * -80}px) scale(${1 + win * 0.04})`, transformOrigin: "50% 50%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, direction: "ltr", borderRadius: 28, padding: "16px 28px",
        background: isCorrect && win > 0.01 ? withAlpha(b.colors.primary, 0.12 * win) : b.colors.surface,
        border: `4px solid ${isCorrect && win > 0.01 ? b.colors.primary : withAlpha(b.colors.text, 0.1)}`,
        boxShadow: win > 0 ? `0 0 ${46 * win}px ${withAlpha(b.colors.secondary, 0.35)}` : `0 8px 24px ${withAlpha(b.colors.text, 0.06)}` }}>
        <div style={{ width: 80, height: 80, flex: "0 0 80px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: latin, fontWeight: 700, fontSize: 40,
          color: ok ? b.colors.surface : b.colors.primary, background: ok ? b.colors.primary : withAlpha(b.colors.primary, 0.1) }}>
          {ok ? "✓" : LETTERS[i]}
        </div>
        <div style={{ fontFamily: latin, fontWeight: 600, fontSize: 62, color: b.colors.text, position: "relative", whiteSpace: "nowrap" }}>
          {p.options[i].text}
          {strike > 0 ? <span style={{ position: "absolute", left: -8, top: "54%", height: 7, width: `calc((100% + 16px) * ${strike})`, background: b.colors.secondary, borderRadius: 4 }} /> : null}
        </div>
      </div>
      {p.options[i].whyAr ? (
        <div style={{ direction: "rtl", fontFamily: arabic, fontWeight: 600, fontSize: 36, color: b.colors.text, marginTop: 4, paddingRight: 18, opacity: why, transform: `translateY(${(1 - why) * 10}px)`, whiteSpace: "nowrap" }}>
          <span style={{ color: b.colors.secondary }}>✕ </span>{p.options[i].whyAr}
        </div>
      ) : null}
    </div>
  );
};

const Countdown: React.FC<{ ph: Phase[] }> = ({ ph }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const th = phaseAt(ph, "think");
  const local = f - th.from;
  const appear = interpolate(local, [0, 8], [0, 1], { ...clamp, easing: ease });
  const gone = interpolate(local, [th.frames - 6, th.frames], [1, 0], clamp);
  if (local < 0 || local >= th.frames) return null;
  const secs = Math.max(1, Math.round(th.frames / 30));
  const left = Math.max(1, secs - Math.floor(local / 30));
  const tickPop = 1 + 0.12 * Math.max(0, 1 - (local % 30) / 8);
  const R = 82, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", top: OPT_TOP + 4 * OPT_STEP - 26, left: 0, right: 0, opacity: appear * gone, transform: `scale(${0.8 + 0.2 * appear})`, display: "flex", flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 22 }}>
      <svg width={170} height={170} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 10px 26px ${withAlpha(b.colors.secondary, 0.35)})` }}>
        <circle cx={100} cy={100} r={R} fill={b.colors.surface} stroke={withAlpha(b.colors.secondary, 0.18)} strokeWidth={14} />
        <circle cx={100} cy={100} r={R} fill="none" stroke={b.colors.secondary} strokeWidth={14} strokeLinecap="round" strokeDasharray={C}
          strokeDashoffset={C * (local / th.frames)} transform="rotate(-90 100 100)" />
        <text x={100} y={102} textAnchor="middle" dominantBaseline="central" fontFamily={latin} fontWeight={700} fontSize={84} fill={b.colors.text}
          style={{ transformOrigin: "100px 100px", transform: `scale(${tickPop})` }}>{left}</text>
      </svg>
      <div style={{ fontFamily: arabic, fontWeight: 700, fontSize: 54, color: b.colors.secondary }}>فكّر…</div>
    </div>
  );
};

const AnalysisRow: React.FC<{ at: number; icon: string; label: string; last?: boolean; children: React.ReactNode }> = ({ at, icon, label, last, children }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const s = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * 24}px)`, marginBottom: last ? 0 : 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: arabic, fontWeight: 700, fontSize: 32, color: b.colors.secondary, marginBottom: 10 }}>
        <span style={{ width: 46, height: 46, borderRadius: 999, background: withAlpha(b.colors.secondary, 0.14), display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: latin, fontSize: 26 }}>{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
};

const AnalysisCard: React.FC<{ p: StepDecodeProps; ph: Phase[]; ev: StepEvents }> = ({ p, ph, ev }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const r = phaseAt(ph, "rule");
  const a = interpolate(f, [r.from, r.from + 12], [0, 1], { ...clamp, easing: ease });
  const typed = Math.floor(interpolate(f, [ev.ruleSteps[1] + 4, ev.ruleSteps[1] + 30], [0, (p.rule.pattern ?? "").length], clamp));
  return (
    <div style={{ position: "absolute", top: OPT_TOP - 10, left: SIDE.left, right: SIDE.right, opacity: a, transform: `translateY(${(1 - a) * 60}px)`,
      background: b.colors.surface, borderRadius: 40, padding: "30px 38px", border: `4px solid ${b.colors.primary}`, boxShadow: `0 26px 70px ${withAlpha(b.colors.primary, 0.18)}`, direction: "rtl" }}>
      {p.rule.clueAr ? (
        <AnalysisRow at={ev.ruleSteps[0]} icon="1" label="الدليل">
          <div style={{ fontFamily: arabic, fontWeight: 600, fontSize: 40, lineHeight: 1.4, color: b.colors.text }}>{p.rule.clueAr}</div>
        </AnalysisRow>
      ) : null}
      <AnalysisRow at={ev.ruleSteps[1]} icon="2" label="القاعدة">
        <div style={{ fontFamily: arabic, fontWeight: 700, fontSize: 48, color: b.colors.text, marginBottom: 10 }}>{p.rule.titleAr}</div>
        {p.rule.pattern ? (
          <div style={{ direction: "ltr", fontFamily: mono, fontWeight: 700, fontSize: 31, color: b.colors.primary, background: withAlpha(b.colors.primary, 0.08), borderRadius: 18, padding: "14px 18px", minHeight: 44, whiteSpace: "nowrap" }}>
            {p.rule.pattern.slice(0, typed)}
          </div>
        ) : null}
      </AnalysisRow>
      <AnalysisRow at={ev.ruleSteps[2]} icon="3" label="المعنى" last>
        <div style={{ fontFamily: arabic, fontSize: 38, lineHeight: 1.45, color: b.colors.text }}>{p.rule.explainAr}</div>
      </AnalysisRow>
    </div>
  );
};

const Outro: React.FC<{ p: StepDecodeProps; ev: StepEvents }> = ({ p, ev }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const sub = interpolate(f, [ev.outroLines[1], ev.outroLines[1] + 12], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px` }}>
      <Words text={p.ctaAr} delay={ev.outroLines[0]} size={74} align="center" stagger={3} lineHeight={1.35} />
      {p.ctaSubAr ? (
        <div style={{ marginTop: 40, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`, padding: "22px 34px", borderRadius: 40, background: b.colors.primary, maxWidth: 860 }}>
          <Words text={p.ctaSubAr} delay={ev.outroLines[1]} size={42} weight={600} align="center" color={b.colors.surface} stagger={2} plainLatin />
        </div>
      ) : null}
      {p.handle ? <div style={{ marginTop: 26, fontFamily: latin, fontWeight: 700, fontSize: 44, backgroundImage: brandGradient(b), WebkitBackgroundClip: "text", color: "transparent" }}>{p.handle}</div> : null}
    </AbsoluteFill>
  );
};

const Inner: React.FC<StepDecodeProps> = (p) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const ph = phasesOf(p);
  const total = stepTotal(ph);
  const P = (n: PhaseName) => phaseAt(ph, n);
  const ev = stepEvents(ph, p.options.length, p.perOption ?? ELIMINATE_PER_OPTION);
  const wrong = p.options.map((_, i) => i).filter((i) => i !== p.correct);
  const between = (a: number, z: number) => f >= a && f < z;
  // short cross-fades between blocks (no hard pops)
  const optsOut = interpolate(f, [P("rule").from - 8, P("rule").from + 2], [1, 0], clamp);
  const cardOut = interpolate(f, [P("outro").from - 8, P("outro").from + 2], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: b.colors.background, backgroundImage: `radial-gradient(ellipse at 85% 0%, ${withAlpha(b.colors.primary, 0.12)}, transparent 55%), radial-gradient(ellipse at 0% 100%, ${withAlpha(b.colors.secondary, 0.1)}, transparent 50%)` }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${b.colors.line} 1px, transparent 1px), linear-gradient(90deg, ${b.colors.line} 1px, transparent 1px)`, backgroundSize: "72px 72px", opacity: 0.3 }} />
      <Wordmark />

      {between(0, P("hook").frames) ? <Hook p={p} ph={ph} /> : null}

      {between(P("question").from, P("outro").from + 2) ? (
        <div style={{ opacity: cardOut }}><QuestionCard p={p} ph={ph} ev={ev} /></div>
      ) : null}

      {between(P("options").from, P("rule").from + 2) ? (
        <div style={{ opacity: optsOut }}>
          {p.options.map((_, i) => <OptionRow key={i} p={p} ev={ev} i={i} k={wrong.indexOf(i)} />)}
        </div>
      ) : null}

      <Countdown ph={ph} />

      {between(P("rule").from, P("outro").from + 2) ? <div style={{ opacity: cardOut }}><AnalysisCard p={p} ph={ph} ev={ev} /></div> : null}

      {f >= P("outro").from ? <Outro p={p} ev={ev} /> : null}

      {p.sampleLabelAr && !between(P("think").from, P("think").from + P("think").frames) ? (
        <div style={{ position: "absolute", top: SAFE.bottom - 4, left: SAFE.left, right: SAFE.right, textAlign: "center", fontFamily: arabic, fontSize: 26, color: b.colors.muted, direction: "rtl" }}>{p.sampleLabelAr}</div>
      ) : null}

      {p.teacher ? (
        <div style={{ position: "absolute", left: SAFE.left - 30, top: SAFE.bottom - 280, width: 240, height: 240, borderRadius: 999, overflow: "hidden", border: `6px solid ${b.colors.surface}`, boxShadow: `0 10px 40px ${withAlpha(b.colors.text, 0.25)}` }}>
          <Clip src={p.teacher.src} from={p.teacher.from ?? 0} duration={total} zoom={[1.15, 1.15]} volume={p.teacher.volume ?? 1} />
        </div>
      ) : null}

      {p.voiceover?.src ? <Html5Audio src={staticFile(p.voiceover.src)} volume={p.voiceover.volume ?? 1} /> : null}
      {(p.voiceover?.segments ?? []).map((sg, i) => (
        <Sequence key={`vo${i}`} from={segmentStart(ph, sg, p.perOption)} durationInFrames={sg.frames + 6} layout="none" name={`vo:${sg.phase}${sg.option ?? ""}`}>
          <Html5Audio src={staticFile(sg.src)} volume={p.voiceover?.volume ?? 1} />
        </Sequence>
      ))}
      {p.music ? (
        <Html5Audio src={staticFile(p.music.src)} volume={musicDuck({ base: p.music.volume ?? 0.5, total,
          ducks: p.voiceover?.ducks ?? [
            ...(p.voiceover?.segments ?? []).map((sg) => { const a = segmentStart(ph, sg, p.perOption); return { from: a - 6, to: a + sg.frames + 6, level: 0.35 }; }),
            ...(p.voiceover?.src ? [{ from: 0, to: total, level: 0.35 }] : []),
          ] })} />
      ) : null}
      <SfxTrack cues={stepCues(ev, P("outro").from)} />
    </AbsoluteFill>
  );
};

export const StepDecode: React.FC<StepDecodeProps> = (p) => (
  <BrandProvider id={p.brand ?? "lef-step"}>
    <Surface mode="graphic">
      <Inner {...p} />
    </Surface>
  </BrandProvider>
);
