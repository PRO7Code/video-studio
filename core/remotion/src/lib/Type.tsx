import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { arabic, latin, mono } from "./theme";
import { useBrand, brandGradient, useInk, withAlpha } from "./brand";

const isLatin = (w: string) => /[A-Za-z0-9]/.test(w) && !/[؀-ۿ]/.test(w);

/**
 * Arabic RTL kinetic line. Words (never letters, to keep Arabic ligatures intact)
 * rise in with blur. Latin tech terms are auto-detected and rendered with the tech gradient.
 * Use "_" to glue a multi-word Latin term, e.g. "AI_Agent".
 */
export const Words: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: "right" | "center";
  exitAt?: number;
  lineHeight?: number;
}> = ({
  text,
  delay = 0,
  stagger = 4,
  size = 88,
  weight = 700,
  color,
  align = "right",
  exitAt,
  lineHeight = 1.25,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = useBrand();
  const ink = useInk();
  const words = text.split(" ");
  const exit =
    exitAt === undefined
      ? 0
      : interpolate(frame, [exitAt, exitAt + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });
  return (
    <div
      style={{
        direction: "rtl",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.28,
        lineHeight,
        fontFamily: arabic,
        fontWeight: weight,
        fontSize: size,
        color: color ?? ink,
        textShadow: b.isLight && ink === b.colors.text ? "none" : "0 6px 30px rgba(0,0,0,0.45)",
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 18, stiffness: 140, mass: 0.7 },
        });
        const lat = isLatin(w);
        const label = w.replace(/_/g, " ");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p * (1 - exit),
              transform: `translateY(${(1 - p) * size * 0.6 - exit * 30}px)`,
              filter: `blur(${(1 - p) * 10 + exit * 8}px)`,
              unicodeBidi: "isolate",
              ...(lat
                ? {
                    fontFamily: latin,
                    direction: "ltr",
                    letterSpacing: -size * 0.02,
                    backgroundImage: brandGradient(b),
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "none",
                    filter: `blur(${(1 - p) * 10 + exit * 8}px)${b.isLight && ink === b.colors.text ? "" : " drop-shadow(0 6px 24px rgba(0,0,0,0.5))"}`,
                    paddingBottom: size * 0.08,
                  }
                : {}),
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

/** Small chapter kicker: "٠١ — عرض الأفكار" with a drawing accent line. */
export const Kicker: React.FC<{ num: string; label: string; delay?: number }> = ({
  num,
  label,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const ink = useInk();
  const p = interpolate(frame - delay, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        direction: "rtl",
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontFamily: arabic,
        fontSize: 38,
        fontWeight: 400,
        color: ink,
        opacity: p,
      }}
    >
      <span style={{ fontFamily: mono, fontWeight: 700, color: b.colors.primary, fontSize: 36 }}>{num}</span>
      <span style={{ width: 90 * p, height: 3, background: b.colors.primary, borderRadius: 2 }} />
      <span style={{ transform: `translateX(${(1 - p) * -20}px)` }}>{label}</span>
    </div>
  );
};

/** Glassy pill for tech keywords. */
export const Chip: React.FC<{
  children: React.ReactNode;
  delay?: number;
  accent?: string;
  size?: number;
  icon?: React.ReactNode;
}> = ({ children, delay = 0, accent: accentProp, size = 40, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = useBrand();
  const ink = useInk();
  const accent = accentProp ?? b.colors.primary;
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.36}px ${size * 0.7}px`,
        borderRadius: 999,
        background: b.colors.surface,
        border: `2px solid ${accent}`,
        boxShadow: `0 0 ${30 * p}px ${withAlpha(accent, 0.33)}, inset 0 0 20px ${withAlpha(accent, 0.13)}`,
        color: b.isLight && ink === b.colors.text ? b.colors.text : b.colors.onMedia,
        fontFamily: latin,
        fontWeight: 700,
        fontSize: size,
        opacity: p,
        transform: `scale(${0.7 + 0.3 * p})`,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </div>
  );
};

/** "In development" status badge — the agent is a work in progress. */
export const DevBadge: React.FC<{ delay?: number; size?: number; label?: string }> = ({ delay = 0, size = 34, label = "قيد التطوير" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const amber = useBrand().colors.accent;
  const p = spring({ frame: frame - delay, fps, config: { damping: 16 } });
  const blink = 0.45 + 0.55 * Math.abs(Math.sin((frame - delay) / 9));
  return (
    <div
      style={{
        direction: "rtl",
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: `${size * 0.35}px ${size * 0.75}px`,
        borderRadius: 999,
        alignSelf: "flex-start",
        background: withAlpha(amber, 0.14),
        border: `2px solid ${amber}`,
        color: amber,
        fontFamily: arabic,
        fontWeight: 600,
        fontSize: size,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      <span
        style={{
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: 99,
          background: amber,
          opacity: blink,
          boxShadow: `0 0 16px ${amber}`,
        }}
      />
      {label}
    </div>
  );
};
