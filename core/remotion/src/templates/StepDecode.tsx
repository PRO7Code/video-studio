import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing, CalculateMetadataFunction } from "remotion";
import { BrandProvider, Surface, useBrand, withAlpha, brandGradient } from "../lib/brand";
import { arabic, latin, mono, SAFE } from "../lib/theme";
import { Words, Chip, Kicker } from "../lib/Type";
import { Clip } from "../lib/Clip";
import { SfxTrack, type Cue } from "../lib/SfxTrack";
import { musicDuck, popCue, tickCue, transitionCue } from "../lib/audio";
import { stepPhases, stepTotal, phaseAt, type Phase, type PhaseName } from "./stepDecodeTiming";

/**
 * STEP DECODE – question breakdown template (LEF Academy).
 * Everything comes from one episode JSON (projects/lef-academy/step-decode/episodes/*.json):
 * hook → question → options → think (countdown) → eliminate wrong options with reasons → reveal → rule → CTA.
 * Optional: teacher clip (picture-in-picture), voice-over (music ducks under it), music bed.
 */
export type StepOption = { text: string; whyAr?: string };
export type StepDecodeProps = {
  brand?: string;
  skill: string; // e.g. "Grammar"
  skillAr: string; // e.g. "قواعد"
  hookAr: string;
  question: { stem: string; blank?: string; highlight?: string[] }; // blank marker in stem, default "___"
  options: StepOption[]; // 2–5
  correct: number; // index into options
  rule: { titleAr: string; pattern?: string; explainAr: string };
  thinkSeconds?: number;
  ctaAr: string;
  handle?: string | null; // only real, approved handles
  sampleLabelAr?: string | null; // e.g. "سؤال تدريبي – ليس من اختبار رسمي"
  teacher?: { src: string; from?: number; volume?: number } | null;
  voiceover?: { src: string; ducks?: { from: number; to: number }[] } | null;
  music?: { src: string; volume?: number } | null;
  timing?: Partial<Record<PhaseName, number>>;
};

const LETTERS = ["A", "B", "C", "D", "E"];
const phasesOf = (p: StepDecodeProps) =>
  stepPhases({ wrongCount: p.options.length - 1, thinkSeconds: p.thinkSeconds, overrides: p.timing });

export const calcStepMetadata: CalculateMetadataFunction<StepDecodeProps> = ({ props }) => ({
  durationInFrames: stepTotal(phasesOf(props)),
});

/** frame-local progress helpers */
const useP = (from: number, dur: number, ease = Easing.out(Easing.cubic)) => {
  const f = useCurrentFrame();
  return interpolate(f, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
};

const Wordmark: React.FC = () => {
  const b = useBrand();
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14, fontFamily: latin }}>
      <span style={{ fontWeight: 700, fontSize: 40, letterSpacing: 6, color: b.colors.primary }}>STEP</span>
      <span style={{ fontWeight: 700, fontSize: 40, letterSpacing: 6, color: b.colors.secondary }}>DECODE</span>
    </div>
  );
};

const QuestionCard: React.FC<{ p: StepDecodeProps; ph: Phase[] }> = ({ p, ph }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const q = phaseAt(ph, "question");
  const rv = phaseAt(ph, "reveal");
  const appear = useP(q.from, 18);
  const marker = p.question.blank ?? "___";
  const filled = useP(rv.from + 10, 14);
  const words = p.question.stem.split(" ");
  const hl = new Set((p.question.highlight ?? []).map((w) => w.toLowerCase()));
  const shrink = interpolate(f, [phaseAt(ph, "options").from, phaseAt(ph, "options").from + 16], [1, 0.86], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: 330, left: SAFE.left, right: SAFE.right - 60, transform: `translateY(${(1 - appear) * 40}px) scale(${shrink})`, transformOrigin: "50% 0%", opacity: appear,
      background: b.colors.surface, borderRadius: 36, padding: "44px 46px", boxShadow: `0 24px 60px ${withAlpha(b.colors.primary, 0.14)}`, border: `2px solid ${withAlpha(b.colors.primary, 0.18)}` }}>
      <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 22 }}>
        <Chip delay={q.from + 6} size={26}>{p.skill}</Chip>
        <Chip delay={q.from + 10} size={26} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
      </div>
      <div style={{ direction: "ltr", fontFamily: latin, fontWeight: 500, fontSize: 58, lineHeight: 1.35, color: b.colors.text, display: "flex", flexWrap: "wrap", columnGap: 16 }}>
        {words.map((w, i) => {
          const isBlank = w.includes(marker);
          const clean = w.replace(/[^A-Za-z']/g, "").toLowerCase();
          const ul = hl.has(clean) ? interpolate(f, [q.from + 40 + i * 2, q.from + 58 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          if (isBlank) {
            const answer = p.options[p.correct]?.text ?? "";
            const rest = w.replace(marker, "");
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", minWidth: 150, textAlign: "center" }}>
                <span style={{ opacity: 1 - filled, color: b.colors.secondary }}>{"_____"}</span>
                <span style={{ position: "absolute", left: 0, right: 0, opacity: filled, color: b.colors.primary, fontWeight: 700, transform: `scale(${0.8 + 0.2 * filled})` }}>{answer}</span>
                {rest}
              </span>
            );
          }
          return (
            <span key={i} style={{ position: "relative", display: "inline-block" }}>
              {w}
              <span style={{ position: "absolute", left: 0, bottom: 4, height: 6, width: `${ul * 100}%`, borderRadius: 3, background: withAlpha(b.colors.secondary, 0.55) }} />
            </span>
          );
        })}
      </div>
    </div>
  );
};

const OptionRow: React.FC<{ p: StepDecodeProps; ph: Phase[]; i: number; elimOrder: number }> = ({ p, ph, i, elimOrder }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = phaseAt(ph, "options"), el = phaseAt(ph, "eliminate"), rv = phaseAt(ph, "reveal");
  const inP = spring({ frame: f - (op.from + 12 + i * 12), fps, config: { damping: 16, stiffness: 150 } });
  const isCorrect = i === p.correct;
  const strikeAt = el.from + 10 + elimOrder * 60;
  const strike = isCorrect ? 0 : interpolate(f, [strikeAt, strikeAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const why = isCorrect ? 0 : interpolate(f, [strikeAt + 10, strikeAt + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const win = isCorrect ? spring({ frame: f - rv.from, fps, config: { damping: 12, stiffness: 140 } }) : 0;
  const rowTop = 780 + i * 162;
  const border = isCorrect && win > 0.01 ? b.colors.primary : withAlpha(b.colors.text, 0.12);
  return (
    <div style={{ position: "absolute", top: rowTop, left: SAFE.left, right: SAFE.right - 60, opacity: inP * (1 - strike * 0.55), transform: `translateX(${(1 - inP) * -60}px) scale(${1 + win * 0.04})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, direction: "ltr", background: isCorrect ? withAlpha(b.colors.primary, 0.1 * win) : "transparent",
        borderRadius: 26, padding: "18px 26px", border: `3px solid ${border}`, boxShadow: win > 0 ? `0 0 ${40 * win}px ${withAlpha(b.colors.primary, 0.35)}` : "none", position: "relative" }}>
        <div style={{ width: 70, height: 70, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: latin, fontWeight: 700, fontSize: 36,
          color: isCorrect && win > 0.5 ? b.colors.surface : b.colors.primary, background: isCorrect && win > 0.5 ? b.colors.primary : withAlpha(b.colors.primary, 0.1) }}>
          {isCorrect && win > 0.5 ? "✓" : LETTERS[i]}
        </div>
        <div style={{ fontFamily: latin, fontWeight: 500, fontSize: 50, color: b.colors.text, position: "relative" }}>
          {p.options[i].text}
          {strike > 0 ? <span style={{ position: "absolute", left: -6, top: "52%", height: 6, width: `calc((100% + 12px) * ${strike})`, background: b.colors.secondary, borderRadius: 3 }} /> : null}
        </div>
      </div>
      {p.options[i].whyAr ? (
        <div style={{ direction: "rtl", fontFamily: arabic, fontSize: 30, color: b.colors.secondary, marginTop: 6, paddingRight: 14, opacity: why, transform: `translateY(${(1 - why) * 8}px)` }}>
          {p.options[i].whyAr}
        </div>
      ) : null}
    </div>
  );
};

const Countdown: React.FC<{ ph: Phase[]; seconds: number }> = ({ ph, seconds }) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const th = phaseAt(ph, "think");
  const appear = useP(th.from, 10);
  const local = f - th.from;
  if (local < 0 || local >= th.frames) return null;
  const left = Math.max(1, Math.ceil(seconds - local / 30));
  const prog = local / th.frames;
  const R = 70, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", top: 1360, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: appear, direction: "rtl" }}>
      <svg width={170} height={170} viewBox="0 0 170 170">
        <circle cx={85} cy={85} r={R} fill={b.colors.surface} stroke={withAlpha(b.colors.text, 0.1)} strokeWidth={10} />
        <circle cx={85} cy={85} r={R} fill="none" stroke={b.colors.secondary} strokeWidth={10} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * prog} transform="rotate(-90 85 85)" />
        <text x={85} y={85} textAnchor="middle" dominantBaseline="central" fontFamily={latin} fontWeight={700} fontSize={64} fill={b.colors.text}>{left}</text>
      </svg>
      <div style={{ fontFamily: arabic, fontWeight: 700, fontSize: 56, color: b.colors.text }}>فكّر…</div>
    </div>
  );
};

const RuleCard: React.FC<{ p: StepDecodeProps; ph: Phase[] }> = ({ p, ph }) => {
  const b = useBrand();
  const r = phaseAt(ph, "rule");
  const a = useP(r.from, 16);
  const typed = Math.floor(interpolate(useCurrentFrame(), [r.from + 18, r.from + 48], [0, (p.rule.pattern ?? "").length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", top: 760, left: SAFE.left, right: SAFE.right - 60, opacity: a, transform: `translateY(${(1 - a) * 50}px)`,
      background: b.colors.surface, borderRadius: 36, padding: "40px 44px", border: `3px solid ${b.colors.primary}`, boxShadow: `0 24px 60px ${withAlpha(b.colors.primary, 0.18)}`, direction: "rtl" }}>
      <Kicker num="✓" label="القاعدة" delay={r.from + 4} />
      <div style={{ fontFamily: arabic, fontWeight: 700, fontSize: 54, color: b.colors.text, margin: "18px 0 18px" }}>{p.rule.titleAr}</div>
      {p.rule.pattern ? (
        <div style={{ direction: "ltr", fontFamily: mono, fontSize: 33, color: b.colors.primary, background: withAlpha(b.colors.primary, 0.08), borderRadius: 18, padding: "18px 22px", marginBottom: 22 }}>
          {p.rule.pattern.slice(0, typed)}
        </div>
      ) : null}
      <div style={{ fontFamily: arabic, fontSize: 38, lineHeight: 1.55, color: b.colors.muted }}>{p.rule.explainAr}</div>
    </div>
  );
};

const Inner: React.FC<StepDecodeProps> = (p) => {
  const b = useBrand();
  const f = useCurrentFrame();
  const ph = phasesOf(p);
  const total = stepTotal(ph);
  const P = (n: PhaseName) => phaseAt(ph, n);
  const wrong = p.options.map((_, i) => i).filter((i) => i !== p.correct);
  const elimOrder = (i: number) => wrong.indexOf(i);
  const inPhase = (n: PhaseName) => f >= P(n).from && f < P(n).from + P(n).frames;
  const showOptions = f >= P("options").from && f < P("rule").from;
  const hookOut = interpolate(f, [P("hook").frames - 12, P("hook").frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cues: Cue[] = [
    { at: 0, file: "hit", volume: 0.35 },
    transitionCue(P("question").from, "zoom", 0.26),
    ...p.options.map((_, i) => popCue(P("options").from + 12 + i * 12, 0.18)),
    ...Array.from({ length: Math.max(1, Math.round(P("think").frames / 30)) }, (_, s) => tickCue(P("think").from + s * 30, 0.22)),
    ...wrong.map((_, k) => ({ at: P("eliminate").from + 10 + k * 60, file: "swish", volume: 0.24 })),
    { at: P("reveal").from, file: "hit", volume: 0.3 },
    { at: P("reveal").from + 2, file: "pop-low", volume: 0.25 },
    transitionCue(P("rule").from, "fade", 0.26),
    { at: P("rule").from + 18, file: "scan", volume: 0.12 },
    popCue(P("outro").from + 8, 0.2),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: b.colors.background, backgroundImage: `radial-gradient(ellipse at 80% 0%, ${withAlpha(b.colors.primary, 0.1)}, transparent 55%), radial-gradient(ellipse at 0% 100%, ${withAlpha(b.colors.secondary, 0.08)}, transparent 50%)` }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${b.colors.line} 1px, transparent 1px), linear-gradient(90deg, ${b.colors.line} 1px, transparent 1px)`, backgroundSize: "72px 72px", opacity: 0.35 }} />
      <Wordmark />

      {inPhase("hook") ? (
        <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px`, opacity: hookOut }}>
          <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 26 }}>
            <Chip delay={4} size={30}>{p.skill}</Chip>
            <Chip delay={8} size={30} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
          </div>
          <Words text={p.hookAr} delay={6} size={96} stagger={4} />
        </AbsoluteFill>
      ) : null}

      {f >= P("question").from && f < P("rule").from ? <QuestionCard p={p} ph={ph} /> : null}
      {showOptions ? p.options.map((_, i) => <OptionRow key={i} p={p} ph={ph} i={i} elimOrder={elimOrder(i)} />) : null}
      <Countdown ph={ph} seconds={Math.round(P("think").frames / 30)} />
      {f >= P("rule").from && f < P("outro").from ? <RuleCard p={p} ph={ph} /> : null}
      {f >= P("rule").from && f < P("outro").from ? (
        <div style={{ position: "absolute", top: 400, left: SAFE.left, right: SAFE.right - 60, direction: "ltr", fontFamily: latin, fontSize: 50, color: b.colors.text, lineHeight: 1.35 }}>
          {(() => {
            const [before, after = ""] = p.question.stem.split(p.question.blank ?? "___");
            return <span>{before}<b style={{ color: b.colors.primary }}>{p.options[p.correct]?.text}</b>{after}</span>;
          })()}
        </div>
      ) : null}

      {f >= P("outro").from ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px` }}>
          <Words text={p.ctaAr} delay={P("outro").from + 4} size={70} align="center" />
          {p.handle ? <div style={{ marginTop: 26, fontFamily: latin, fontWeight: 700, fontSize: 44, backgroundImage: brandGradient(b), WebkitBackgroundClip: "text", color: "transparent" }}>{p.handle}</div> : null}
        </AbsoluteFill>
      ) : null}

      {p.sampleLabelAr ? (
        <div style={{ position: "absolute", bottom: 1920 - SAFE.bottom - 60, left: 0, right: 0, textAlign: "center", fontFamily: arabic, fontSize: 24, color: b.colors.muted, direction: "rtl" }}>{p.sampleLabelAr}</div>
      ) : null}

      {p.teacher ? (
        <div style={{ position: "absolute", left: SAFE.left - 30, bottom: 1920 - SAFE.bottom + 10, width: 260, height: 260, borderRadius: 999, overflow: "hidden", border: `6px solid ${b.colors.surface}`, boxShadow: `0 10px 40px ${withAlpha(b.colors.text, 0.25)}` }}>
          <Clip src={p.teacher.src} from={p.teacher.from ?? 0} duration={total} zoom={[1.15, 1.15]} volume={p.teacher.volume ?? 1} />
        </div>
      ) : null}

      {p.voiceover ? <Html5Audio src={staticFile(p.voiceover.src)} /> : null}
      {p.music ? (
        <Html5Audio src={staticFile(p.music.src)} volume={musicDuck({ base: p.music.volume ?? 0.6, ducks: p.voiceover?.ducks ?? (p.voiceover ? [{ from: 0, to: total, level: 0.35 }] : []), total })} />
      ) : null}
      <SfxTrack cues={cues} />
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
