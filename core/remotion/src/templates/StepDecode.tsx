import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useVideoConfig, random, CalculateMetadataFunction } from "remotion";
import { BrandProvider, Surface, useBrand, withAlpha, brandGradient } from "../lib/brand";
import { arabic, latin, mono, SAFE } from "../lib/theme";
import { Chip } from "../lib/Type";
import { Clip } from "../lib/Clip";
import type { Cue } from "../lib/SfxTrack";
import { musicDuck } from "../lib/audio";
import { KineticText, useT, springT, ease, motionBlur, BASE_FPS } from "../lib/Kinetic";
import { stepPhases, stepTotal, phaseAt, strikeFrame, ELIMINATE_PER_OPTION, type Phase, type PhaseName } from "./stepDecodeTiming";
import { stepEvents, stepCues, STEM_WORD_GAP, FORMULA_GAP, type StepEvents } from "./stepDecodeEvents";

/**
 * STEP DECODE – question breakdown (LEF Academy), v3 "premium motion".
 * One episode JSON drives everything. Timeline is a 30-fps timebase (see Kinetic.useT) so `fps: 60` renders the same
 * edit with twice the motion samples. Scenes: kinetic hook → question built word-by-word → staggered options →
 * 3 s countdown → eliminations (shake · strike · reason) → reveal (shockwave · sparks · check draw) → staged analysis
 * (clue → formula chips → meaning) → CTA + links. Sounds are cued from the same events (stepDecodeEvents).
 */
export type StepOption = { text: string; whyAr?: string };
export type VoSegment = { src: string; phase: PhaseName; option?: number; offset?: number; frames: number };
export type StepDecodeProps = {
  brand?: string;
  skill: string;
  skillAr: string;
  hookAr: string; // ≤ 8 words; markup: *emphasis* ^marker^, "_" glues terms
  question: { stem: string; blank?: string; highlight?: string[] };
  options: StepOption[];
  correct: number;
  rule: { titleAr: string; pattern?: string; explainAr: string; clueAr?: string; clueTokens?: string[] };
  thinkSeconds?: number;
  ctaAr: string;
  ctaSubAr?: string | null;
  handle?: string | null;
  links?: Record<string, string> | null;
  sampleLabelAr?: string | null;
  teacher?: { src: string; from?: number; volume?: number } | null;
  voiceover?: { src?: string; ducks?: { from: number; to: number }[]; segments?: VoSegment[]; volume?: number } | null;
  music?: { src: string; volume?: number } | null;
  timing?: Partial<Record<PhaseName, number>>;
  perOption?: number;
  sfx?: boolean; // built-in STEP DECODE sound kit (default true)
  fps?: 30 | 60; // render rate; the timeline stays the same
};

const LETTERS = ["A", "B", "C", "D", "E"];
const phasesOf = (p: StepDecodeProps) =>
  stepPhases({ wrongCount: p.options.length - 1, thinkSeconds: p.thinkSeconds, overrides: p.timing, perOption: p.perOption });
/** formula "If + past simple → would + base verb" → chips */
export const formulaChips = (pattern?: string) =>
  (pattern ?? "").split(/\s*(\+|→|->)\s*/).filter((x) => x && x.trim()).map((x) => (x === "->" ? "→" : x.trim()));

export const segmentStart = (ph: Phase[], s: VoSegment, perOption?: number) =>
  s.phase === "eliminate" && s.option !== undefined
    ? strikeFrame(ph, s.option, perOption ?? ELIMINATE_PER_OPTION) + (s.offset ?? 0)
    : phaseAt(ph, s.phase).from + (s.offset ?? 6);

export const calcStepMetadata: CalculateMetadataFunction<StepDecodeProps> = ({ props }) => {
  const fps = props.fps ?? 30;
  return { fps, durationInFrames: Math.round((stepTotal(phasesOf(props)) * fps) / BASE_FPS) };
};

const norm = (w: string) => w.replace(/[^A-Za-z']/g, "").toLowerCase();
const CARD_TOP = 300;
const OPT_TOP = 700;
const OPT_STEP = 166;
const SIDE = { left: SAFE.left - 20, right: SAFE.right - 70 };

/** layered depth: inner top highlight + contact shadow + soft brand-tinted key shadow */
const depth = (b: ReturnType<typeof useBrand>, lift = 1) =>
  `inset 0 1.5px 0 rgba(255,255,255,0.95), 0 ${2 * lift}px ${6 * lift}px ${withAlpha(b.colors.text, 0.07)}, 0 ${22 * lift}px ${54 * lift}px -${12 * lift}px ${withAlpha(b.colors.primary, 0.3)}`;

const Backdrop: React.FC<{ t: number; focus: number }> = ({ t, focus }) => {
  const b = useBrand();
  const dx = Math.sin(t / 90) * 60, dy = Math.cos(t / 110) * 40;
  return (
    <AbsoluteFill style={{ backgroundColor: b.colors.background, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, left: 380 + dx, top: -420 + dy, borderRadius: 999, background: `radial-gradient(circle, ${withAlpha(b.colors.primary, 0.2)}, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1000, height: 1000, left: -520 - dx, top: 1250 - dy, borderRadius: 999, background: `radial-gradient(circle, ${withAlpha(b.colors.secondary, 0.17)}, transparent 62%)` }} />
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${b.colors.line} 1px, transparent 1px), linear-gradient(90deg, ${b.colors.line} 1px, transparent 1px)`, backgroundSize: "72px 72px", backgroundPosition: `0 ${-t * 0.4}px`, opacity: 0.28 }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.65) 0%, transparent 22%, transparent 80%, ${withAlpha(b.colors.primary, 0.06)} 100%)` }} />
      {/* focus: soft spotlight during the countdown */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 52%, transparent 40%, ${withAlpha(b.colors.text, 0.1 * focus)} 100%)` }} />
    </AbsoluteFill>
  );
};

const Wordmark: React.FC<{ t: number }> = ({ t }) => {
  const b = useBrand();
  const a = ease(t, 0, 10);
  return (
    <div style={{ position: "absolute", top: 172, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14, fontFamily: latin, fontWeight: 700, fontSize: 34, letterSpacing: 7, opacity: a, transform: `translateY(${(1 - a) * -14}px)` }}>
      <span style={{ color: b.colors.primary }}>STEP</span>
      <span style={{ color: b.colors.secondary }}>DECODE</span>
    </div>
  );
};

const Hook: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents }> = ({ p, t, ev }) => {
  const b = useBrand();
  const exit = ease(t, ev.hookExit, ev.hookExit + 9);
  const flash = 1 - ease(t, 0, 7);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px`, opacity: 1 - exit, transform: `scale(${1 + exit * 0.18})`, filter: exit > 0.02 ? `blur(${exit * 10}px)` : undefined }}>
      <AbsoluteFill style={{ background: brandGradient(b, 135), opacity: flash * 0.22 }} />
      <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 30, opacity: ease(t, 4, 12) }}>
        <Chip delay={3} size={32}>{p.skill}</Chip>
        <Chip delay={6} size={32} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
      </div>
      <KineticText text={p.hookAr} t={t} at={1} size={108} stagger={3} fromScale={1.45} lineHeight={1.28} />
    </AbsoluteFill>
  );
};

const Stem: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents; think: Phase }> = ({ p, t, ev, think }) => {
  const b = useBrand();
  const marker = p.question.blank ?? "___";
  const flip = ease(t, ev.reveal + 6, ev.reveal + 18);
  const hl = new Set((p.question.highlight ?? []).map((w) => w.toLowerCase()));
  const clue = new Set((p.rule.clueTokens ?? []).map((w) => w.toLowerCase()));
  const clueOn = ease(t, ev.ruleSteps[0] + 4, ev.ruleSteps[0] + 16);
  const words = p.question.stem.split(" ");
  const done = ev.stemWords + words.length * STEM_WORD_GAP;
  const pulse = t > think.from && t < ev.reveal ? 0.5 + 0.5 * Math.sin((t - think.from) / 4) : 0;
  const answer = p.options[p.correct]?.text ?? "";
  return (
    <div style={{ direction: "ltr", fontFamily: latin, fontWeight: 500, fontSize: 74, lineHeight: 1.3, color: b.colors.text, display: "flex", flexWrap: "wrap", columnGap: 18, rowGap: 4 }}>
      {words.map((w, i) => {
        const at = ev.stemWords + i * STEM_WORD_GAP;
        const ap = springT(t, at, { damping: 17, stiffness: 210 });
        const wordStyle: React.CSSProperties = { position: "relative", display: "inline-block", opacity: Math.min(1, ap * 1.5), transform: `translateY(${(1 - ap) * 28}px)`, filter: ap < 0.95 ? `blur(${(1 - ap) * 8}px)` : undefined };
        if (w.includes(marker)) {
          const rest = w.replace(marker, "");
          return (
            <span key={i} style={wordStyle}>
              <span style={{ display: "inline-block", minWidth: 172, textAlign: "center", position: "relative", perspective: 400 }}>
                <span style={{ display: "inline-block", opacity: 1 - flip, color: b.colors.secondary, transform: `rotateX(${flip * 90}deg)`, letterSpacing: 2 }}>_____</span>
                <span style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: flip, color: b.colors.primary, fontWeight: 700, transform: `rotateX(${(1 - flip) * -90}deg)` }}>{answer}</span>
                <span style={{ position: "absolute", left: 8, right: 8, bottom: 2, height: 6, borderRadius: 3, background: b.colors.secondary, opacity: 0.25 + 0.6 * pulse * (1 - flip) }} />
              </span>
              {rest}
            </span>
          );
        }
        const k = norm(w);
        const ul = hl.has(k) ? ease(t, done + 2 + i, done + 14 + i) : 0;
        const c = clue.has(k) ? clueOn : 0;
        return (
          <span key={i} style={{ ...wordStyle, padding: "0 6px", margin: "0 -6px", borderRadius: 12, background: withAlpha(b.colors.primary, 0.13 * c), boxShadow: c > 0 ? `inset 0 0 0 3px ${withAlpha(b.colors.primary, 0.55 * c)}` : "none" }}>
            {w}
            <span style={{ position: "absolute", left: 6, bottom: 6, height: 7, width: `calc((100% - 12px) * ${ul * (1 - c)})`, borderRadius: 4, background: withAlpha(b.colors.secondary, 0.65) }} />
          </span>
        );
      })}
    </div>
  );
};

const QuestionCard: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents; think: Phase }> = ({ p, t, ev, think }) => {
  const b = useBrand();
  const s = springT(t, ev.questionIn - 2, { damping: 17, stiffness: 150 });
  const blur = motionBlur(t, ev.questionIn - 2, 170, { damping: 17, stiffness: 150 });
  const glow = t >= ev.reveal ? ease(t, ev.reveal, ev.reveal + 10) * (1 - ease(t, ev.reveal + 18, ev.reveal + 40)) : 0;
  return (
    <div style={{ position: "absolute", top: CARD_TOP, left: SIDE.left, right: SIDE.right, perspective: 1200 }}>
      <div style={{ opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 170}px) rotateX(${(1 - s) * 22}deg)`, transformOrigin: "50% 100%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        background: b.colors.surface, borderRadius: 40, padding: "36px 44px 42px", boxShadow: `${depth(b, 1.1)}, 0 0 ${60 * glow}px ${withAlpha(b.colors.primary, 0.35 * glow)}`, border: `1.5px solid ${withAlpha(b.colors.primary, 0.14)}` }}>
        <div style={{ direction: "rtl", display: "flex", gap: 12, marginBottom: 18 }}>
          <Chip delay={-100} size={26}>{p.skill}</Chip>
          <Chip delay={-100} size={26} accent={b.colors.secondary}><span style={{ fontFamily: arabic }}>{p.skillAr}</span></Chip>
        </div>
        <Stem p={p} t={t} ev={ev} think={think} />
      </div>
    </div>
  );
};

const OptionRow: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents; i: number; k: number; think: Phase }> = ({ p, t, ev, i, k, think }) => {
  const b = useBrand();
  const isCorrect = i === p.correct;
  const inS = springT(t, ev.optionIn[i], { damping: 15, stiffness: 200 });
  const blur = motionBlur(t, ev.optionIn[i], 140, { damping: 15, stiffness: 200 });
  const badge = springT(t, ev.optionIn[i] + 4, { damping: 11, stiffness: 260 });
  const at = isCorrect ? Number.MAX_SAFE_INTEGER : ev.strike[k];
  const strike = isCorrect ? 0 : ease(t, at, at + 8);
  const shake = isCorrect ? 0 : Math.sin((t - at) * 2.2) * 9 * (1 - ease(t, at, at + 10)) * (t >= at ? 1 : 0);
  const why = isCorrect ? 0 : springT(t, at + 6, { damping: 14, stiffness: 220 });
  const win = isCorrect ? springT(t, ev.reveal, { damping: 11, stiffness: 160 }) : 0;
  const dimOthers = !isCorrect && t >= ev.reveal ? ease(t, ev.reveal, ev.reveal + 8) : 0;
  // think: a light sheen scans the options one per tick
  const sec = Math.floor((t - think.from) / 30);
  const inThink = t >= think.from && t < think.from + think.frames;
  const sheen = inThink ? ease((t - think.from) % 30, 0, 22, -0.3, 1.3, (x) => x) : -1;
  const ok = isCorrect && win > 0.5;
  const check = isCorrect ? ease(t, ev.reveal + 4, ev.reveal + 14) : 0;
  return (
    <div style={{ position: "absolute", top: OPT_TOP + i * OPT_STEP, left: SIDE.left, right: SIDE.right,
      opacity: Math.min(1, inS * 1.5) * (1 - strike * 0.52) * (1 - dimOthers * 0.45),
      transform: `translateX(${(1 - inS) * 140 + shake - strike * 10}px) scale(${(1 - strike * 0.03) * (1 + win * 0.05)})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 28, direction: "ltr", borderRadius: 30, padding: "16px 28px",
        background: isCorrect && win > 0.01 ? `linear-gradient(90deg, ${withAlpha(b.colors.primary, 0.14 * win)}, ${withAlpha(b.colors.primary, 0.05 * win)})` : b.colors.surface,
        border: `${isCorrect && win > 0.01 ? 4 : 1.5}px solid ${isCorrect && win > 0.01 ? b.colors.primary : withAlpha(b.colors.text, 0.09)}`,
        boxShadow: win > 0 ? `${depth(b, 1.2)}, 0 0 ${50 * win}px ${withAlpha(b.colors.secondary, 0.32)}` : depth(b, 0.6) }}>
        {inThink && sec === i % Math.max(1, Math.round(think.frames / 30)) ? (
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 160, left: `${sheen * 100}%`, background: `linear-gradient(90deg, transparent, ${withAlpha(b.colors.primary, 0.12)}, transparent)`, transform: "skewX(-18deg)" }} />
        ) : null}
        <div style={{ width: 80, height: 80, flex: "0 0 80px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: latin, fontWeight: 700, fontSize: 40,
          color: ok ? b.colors.surface : b.colors.primary, background: ok ? b.colors.primary : withAlpha(b.colors.primary, 0.1), transform: `scale(${badge})` }}>
          {ok ? (
            <svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={b.colors.surface} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - check)} /></svg>
          ) : LETTERS[i]}
        </div>
        <div style={{ fontFamily: latin, fontWeight: 600, fontSize: 64, color: b.colors.text, position: "relative", whiteSpace: "nowrap" }}>
          {p.options[i].text}
          {strike > 0 ? <span style={{ position: "absolute", left: -8, top: "54%", height: 7, width: `calc((100% + 16px) * ${strike})`, background: b.colors.secondary, borderRadius: 4 }} /> : null}
        </div>
      </div>
      {p.options[i].whyAr ? (
        <div style={{ direction: "rtl", display: "flex", justifyContent: "flex-start", marginTop: 6, paddingRight: 14, opacity: Math.min(1, why * 1.4), transform: `translateY(${(1 - why) * 14}px) scale(${0.9 + 0.1 * why})`, transformOrigin: "right center" }}>
          <span style={{ fontFamily: arabic, fontWeight: 600, fontSize: 34, color: b.colors.text, whiteSpace: "nowrap", background: withAlpha(b.colors.secondary, 0.1), borderRadius: 14, padding: "2px 14px" }}>
            <span style={{ color: b.colors.secondary, fontWeight: 800 }}>✕ </span>{p.options[i].whyAr}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const RevealBurst: React.FC<{ t: number; at: number; y: number }> = ({ t, at, y }) => {
  const b = useBrand();
  if (t < at || t > at + 30) return null;
  const r = ease(t, at, at + 22, 0, 1, (x) => 1 - Math.pow(1 - x, 3));
  const fade = 1 - ease(t, at + 6, at + 26);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      <ellipse cx={540} cy={y} rx={120 + r * 420} ry={50 + r * 170} fill="none" stroke={b.colors.primary} strokeWidth={6 * fade} opacity={fade * 0.7} />
      {Array.from({ length: 12 }, (_, i) => {
        const ang = (i / 12) * Math.PI * 2 + random(`a${i}`) * 0.4;
        const dist = 160 + random(`d${i}`) * 260;
        const x = 540 + Math.cos(ang) * dist * r * 1.4, yy = y + Math.sin(ang) * dist * r * 0.6;
        const s = (8 + random(`s${i}`) * 8) * fade;
        return <rect key={i} x={x - s / 2} y={yy - s / 2} width={s} height={s} rx={2} transform={`rotate(45 ${x} ${yy})`} fill={i % 2 ? b.colors.secondary : b.colors.primary} opacity={fade} />;
      })}
    </svg>
  );
};

const Countdown: React.FC<{ t: number; think: Phase }> = ({ t, think }) => {
  const b = useBrand();
  const local = t - think.from;
  if (local < -2 || local >= think.frames + 2) return null;
  const secs = Math.max(1, Math.round(think.frames / 30));
  const appear = springT(t, think.from, { damping: 14, stiffness: 200 });
  const gone = 1 - ease(t, think.from + think.frames - 6, think.from + think.frames);
  const left = Math.max(1, secs - Math.floor(local / 30));
  const inSec = ((local % 30) + 30) % 30;
  const flip = ease(inSec, 0, 8);
  const last = left === 1;
  const R = 82, C = 2 * Math.PI * R, seg = C / secs;
  return (
    <div style={{ position: "absolute", top: OPT_TOP + 4 * OPT_STEP - 30, left: 0, right: 0, opacity: Math.min(1, appear) * gone, transform: `scale(${0.7 + 0.3 * appear})`, display: "flex", flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 24 }}>
      <svg width={176} height={176} viewBox="0 0 200 200" style={{ filter: `drop-shadow(0 12px 26px ${withAlpha(b.colors.secondary, last ? 0.5 : 0.3)})` }}>
        <circle cx={100} cy={100} r={R + 10} fill={b.colors.surface} />
        {Array.from({ length: secs }, (_, s) => {
          const remain = Math.max(0, Math.min(1, s + 1 - local / 30)); // segment s empties during second s
          return (
            <g key={s}>
              <circle cx={100} cy={100} r={R} fill="none" stroke={withAlpha(b.colors.secondary, 0.16)} strokeWidth={14} strokeDasharray={`${seg - 8} ${C}`} strokeDashoffset={-s * seg} transform="rotate(-90 100 100)" />
              <circle cx={100} cy={100} r={R} fill="none" stroke={b.colors.secondary} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${Math.max(0.01, (seg - 8) * remain)} ${C}`} strokeDashoffset={-s * seg} transform="rotate(-90 100 100)" />
            </g>
          );
        })}
        <text x={100} y={103} textAnchor="middle" dominantBaseline="central" fontFamily={latin} fontWeight={700} fontSize={88} fill={last ? b.colors.secondary : b.colors.text}
          style={{ transformOrigin: "100px 100px", transform: `scale(${1.35 - 0.35 * flip})`, filter: flip < 0.9 ? `blur(${(1 - flip) * 5}px)` : undefined }}>{left}</text>
      </svg>
      <div style={{ fontFamily: arabic, fontWeight: 800, fontSize: 56, color: b.colors.secondary, transform: `scale(${1 + (last ? 0.06 * Math.sin(inSec / 2.5) : 0)})` }}>فكّر…</div>
    </div>
  );
};

const StepLabel: React.FC<{ n: number; label: string }> = ({ n, label }) => {
  const b = useBrand();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: arabic, fontWeight: 800, fontSize: 30, color: b.colors.secondary, marginBottom: 8 }}>
      <span style={{ width: 42, height: 42, borderRadius: 999, background: b.colors.secondary, color: b.colors.surface, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: latin, fontSize: 24 }}>{n}</span>
      {label}
    </div>
  );
};

const Analysis: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents; rule: Phase }> = ({ p, t, ev, rule }) => {
  const b = useBrand();
  const s = springT(t, rule.from - 2, { damping: 17, stiffness: 150 });
  const blur = motionBlur(t, rule.from - 2, 120, { damping: 17, stiffness: 150 });
  const step = (n: 0 | 1 | 2) => springT(t, ev.ruleSteps[n], { damping: 16, stiffness: 190 });
  const chips = formulaChips(p.rule.pattern);
  const arrow = chips.indexOf("→");
  const row = (n: 0 | 1 | 2, content: React.ReactNode) => {
    const k = step(n);
    return <div style={{ opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 26}px)`, marginBottom: n < 2 ? 20 : 0 }}>{content}</div>;
  };
  return (
    <div style={{ position: "absolute", top: OPT_TOP - 20, left: SIDE.left, right: SIDE.right, opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 120}px)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
      background: b.colors.surface, borderRadius: 40, padding: "30px 36px 34px", border: `3px solid ${b.colors.primary}`, boxShadow: depth(b, 1.2), direction: "rtl" }}>
      {p.rule.clueAr ? row(0, <><StepLabel n={1} label="الدليل" /><KineticText text={p.rule.clueAr} t={t} at={ev.ruleSteps[0] + 4} size={40} weight={600} stagger={1.6} fromScale={1.12} /></>) : null}
      {row(1, <>
        <StepLabel n={2} label="القاعدة" />
        <KineticText text={p.rule.titleAr} t={t} at={ev.ruleSteps[1] + 2} size={50} weight={800} stagger={2} fromScale={1.2} />
        <div style={{ direction: "ltr", display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {chips.map((c, i) => {
            const at = ev.formulaFrom + i * FORMULA_GAP;
            const cp = springT(t, at, { damping: 12, stiffness: 260 });
            const op = c === "+" || c === "→";
            const after = arrow >= 0 && i > arrow;
            const col = op ? b.colors.muted : after ? b.colors.primary : b.colors.secondary;
            return <span key={i} style={{ fontFamily: mono, fontWeight: 700, fontSize: op ? 34 : 32, color: op ? col : b.colors.surface, background: op ? "transparent" : col, borderRadius: 14, padding: op ? "6px 2px" : "8px 16px", opacity: Math.min(1, cp * 1.5), transform: `scale(${0.6 + 0.4 * cp})`, boxShadow: op ? "none" : `0 8px 18px -6px ${withAlpha(col, 0.55)}` }}>{c}</span>;
          })}
        </div>
      </>)}
      {row(2, <><StepLabel n={3} label="المعنى" /><KineticText text={p.rule.explainAr} t={t} at={ev.ruleSteps[2] + 4} size={39} weight={500} stagger={1.6} fromScale={1.1} lineHeight={1.45} /></>)}
    </div>
  );
};

const LINK_LABEL: Record<string, string> = { web: "Web", tiktok: "TikTok", instagram: "Instagram", snapchat: "Snapchat", x: "X", youtube: "YouTube" };
const Outro: React.FC<{ p: StepDecodeProps; t: number; ev: StepEvents }> = ({ p, t, ev }) => {
  const b = useBrand();
  const sub = springT(t, ev.outroLines[1], { damping: 15, stiffness: 180 });
  const links = Object.entries(p.links ?? b.links ?? {});
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${SAFE.right}px 0 ${SAFE.left}px` }}>
      <KineticText text={p.ctaAr} t={t} at={ev.outroLines[0]} size={76} align="center" stagger={2.5} fromScale={1.35} lineHeight={1.32} />
      {p.ctaSubAr ? (
        <div style={{ marginTop: 38, opacity: Math.min(1, sub * 1.4), transform: `translateY(${(1 - sub) * 24}px) scale(${0.92 + 0.08 * sub})`, padding: "22px 34px", borderRadius: 40, background: b.colors.primary, maxWidth: 860, boxShadow: `0 20px 44px -14px ${withAlpha(b.colors.primary, 0.6)}` }}>
          <KineticText text={p.ctaSubAr} t={t} at={ev.outroLines[1] + 2} size={42} weight={600} align="center" color={b.colors.surface} stagger={1.5} latinGradient={false} fromScale={1.1} />
        </div>
      ) : null}
      {links.length ? (
        <div style={{ marginTop: 32, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", direction: "ltr" }}>
          {links.map(([k, v], i) => {
            const l = springT(t, ev.links + i * 5, { damping: 13, stiffness: 220 });
            return (
              <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "14px 26px", borderRadius: 999, background: b.colors.surface, border: `2px solid ${withAlpha(b.colors.primary, 0.35)}`, fontFamily: latin, opacity: Math.min(1, l * 1.5), transform: `translateY(${(1 - l) * 18}px) scale(${0.85 + 0.15 * l})`, boxShadow: depth(b, 0.5) }}>
                <span style={{ fontSize: 26, fontWeight: 600, color: b.colors.secondary, letterSpacing: 1 }}>{LINK_LABEL[k] ?? k}</span>
                <span style={{ fontSize: 40, fontWeight: 700, color: b.colors.primary }}>{v}</span>
              </div>
            );
          })}
        </div>
      ) : null}
      {p.handle ? <div style={{ marginTop: 24, fontFamily: latin, fontWeight: 700, fontSize: 42, backgroundImage: brandGradient(b), WebkitBackgroundClip: "text", color: "transparent" }}>{p.handle}</div> : null}
    </AbsoluteFill>
  );
};

/** SFX on the 30-fps timebase → real frames */
const ScaledSfx: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.round((c.at * fps) / BASE_FPS)} durationInFrames={Math.round(2.5 * fps)} layout="none" name={`sfx:${c.file}`}>
          <Html5Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};

const Inner: React.FC<StepDecodeProps> = (p) => {
  const b = useBrand();
  const { fps } = useVideoConfig();
  const t = useT();
  const ph = phasesOf(p);
  const total = stepTotal(ph);
  const P = (n: PhaseName) => phaseAt(ph, n);
  const ev = stepEvents(ph, p.options.length, p.perOption ?? ELIMINATE_PER_OPTION);
  const wrong = p.options.map((_, i) => i).filter((i) => i !== p.correct);
  const think = P("think"), rule = P("rule"), outro = P("outro");
  const focus = t >= think.from && t < think.from + think.frames ? Math.min(ease(t, think.from, think.from + 10), 1 - ease(t, think.from + think.frames - 8, think.from + think.frames)) : 0;
  const optsOut = 1 - ease(t, rule.from - 10, rule.from + 2);
  const cardOut = 1 - ease(t, outro.from - 10, outro.from + 2);
  const between = (a: number, z: number) => t >= a && t < z;
  const toReal = (x: number) => Math.round((x * fps) / BASE_FPS);

  return (
    <AbsoluteFill>
      <Backdrop t={t} focus={focus} />
      <Wordmark t={t} />
      {between(0, ev.hookExit + 10) ? <Hook p={p} t={t} ev={ev} /> : null}
      {between(ev.questionIn - 4, outro.from + 2) ? <div style={{ opacity: cardOut }}><QuestionCard p={p} t={t} ev={ev} think={think} /></div> : null}
      {between(P("options").from, rule.from + 2) ? (
        <div style={{ opacity: optsOut }}>{p.options.map((_, i) => <OptionRow key={i} p={p} t={t} ev={ev} i={i} k={wrong.indexOf(i)} think={think} />)}</div>
      ) : null}
      <Countdown t={t} think={think} />
      <RevealBurst t={t} at={ev.reveal} y={OPT_TOP + p.correct * OPT_STEP + 56} />
      {between(rule.from - 4, outro.from + 2) ? <div style={{ opacity: cardOut }}><Analysis p={p} t={t} ev={ev} rule={rule} /></div> : null}
      {t >= outro.from - 2 ? <Outro p={p} t={t} ev={ev} /> : null}
      {p.sampleLabelAr && !(t >= think.from && t < think.from + think.frames) ? (
        <div style={{ position: "absolute", top: SAFE.bottom - 4, left: SAFE.left, right: SAFE.right, textAlign: "center", fontFamily: arabic, fontSize: 25, color: b.colors.muted, direction: "rtl" }}>{p.sampleLabelAr}</div>
      ) : null}
      {p.teacher ? (
        <div style={{ position: "absolute", left: SAFE.left - 30, top: SAFE.bottom - 280, width: 240, height: 240, borderRadius: 999, overflow: "hidden", border: `6px solid ${b.colors.surface}`, boxShadow: depth(b, 1) }}>
          <Clip src={p.teacher.src} from={p.teacher.from ?? 0} duration={toReal(total)} zoom={[1.15, 1.15]} volume={p.teacher.volume ?? 1} />
        </div>
      ) : null}
      {p.voiceover?.src ? <Html5Audio src={staticFile(p.voiceover.src)} volume={p.voiceover.volume ?? 1} /> : null}
      {(p.voiceover?.segments ?? []).map((sg, i) => (
        <Sequence key={`vo${i}`} from={toReal(segmentStart(ph, sg, p.perOption))} durationInFrames={toReal(sg.frames + 6)} layout="none" name={`vo:${sg.phase}${sg.option ?? ""}`}>
          <Html5Audio src={staticFile(sg.src)} volume={p.voiceover?.volume ?? 1} />
        </Sequence>
      ))}
      {p.music ? (
        <Html5Audio src={staticFile(p.music.src)} volume={(f) => musicDuck({ base: p.music?.volume ?? 0.5, total,
          ducks: p.voiceover?.ducks ?? [
            ...(p.voiceover?.segments ?? []).map((sg) => { const a = segmentStart(ph, sg, p.perOption); return { from: a - 6, to: a + sg.frames + 6, level: 0.35 }; }),
            ...(p.voiceover?.src ? [{ from: 0, to: total, level: 0.35 }] : []),
          ] })((f * BASE_FPS) / fps)} />
      ) : null}
      {p.sfx === false ? null : <ScaledSfx cues={stepCues(ev, outro.from, formulaChips(p.rule.pattern).map((c, i) => (c === "+" || c === "→" ? -1 : i)).filter((i) => i >= 0))} />}
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
