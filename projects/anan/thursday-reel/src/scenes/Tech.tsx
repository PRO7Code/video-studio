import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Clip } from "../components/Clip";
import { Finish } from "../components/Overlays";
import { Kicker, Words, DevBadge } from "../components/Type";
import { C, arabic, latin, mono, techGradient } from "../theme";
import { SCENES } from "../timeline";

const ChatIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);
const PlaneIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 3 2 10.5l7 3 3 7.5L22 3z" />
    <path d="M9 13.5 22 3" />
  </svg>
);

const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  delay: number;
  title: React.ReactNode;
  sub?: string;
  accent?: string;
  big?: boolean;
  icon?: React.ReactNode;
}> = ({ x, y, w, delay, title, sub, accent = C.teal, big, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
  const pulse = big ? 0.6 + 0.4 * Math.sin((frame - delay) / 8) : 0.4;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y,
        width: w,
        transform: `translateY(-50%) scale(${0.8 + 0.2 * p})`,
        opacity: p,
        padding: big ? "30px 26px" : "20px 22px",
        borderRadius: big ? 36 : 26,
        background: big ? "rgba(10,24,48,0.88)" : "rgba(8,14,32,0.8)",
        border: `${big ? 3 : 2}px solid ${accent}`,
        boxShadow: `0 0 ${big ? 60 * pulse : 18}px ${accent}66`,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon}
        <div
          style={{
            fontFamily: latin,
            fontWeight: 700,
            fontSize: big ? 62 : 40,
            color: C.white,
            letterSpacing: -1,
            ...(big
              ? { backgroundImage: techGradient, WebkitBackgroundClip: "text", color: "transparent" }
              : {}),
          }}
        >
          {title}
        </div>
      </div>
      {sub ? (
        <div style={{ fontFamily: arabic, fontSize: big ? 32 : 27, color: C.muted, direction: "rtl" }}>{sub}</div>
      ) : null}
    </div>
  );
};

/** Animated connector with travelling data packets. */
const Link: React.FC<{ x1: number; y1: number; x2: number; y2: number; delay: number; color?: string }> = ({
  x1,
  y1,
  x2,
  y2,
  delay,
  color = C.teal,
}) => {
  const frame = useCurrentFrame();
  const d = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const len = Math.hypot(x2 - x1, y2 - y1);
  const packets = [0, 0.5].map((o) => ((frame - delay) / 26 + o) % 1);
  return (
    <g opacity={d > 0 ? 1 : 0}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={3}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - d)}
      />
      {d >= 1
        ? packets.map((t, i) => (
            <circle
              key={i}
              cx={x1 + (x2 - x1) * t}
              cy={y1 + (y2 - y1) * t}
              r={7}
              fill={color}
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          ))
        : null}
    </g>
  );
};

/** Act 3 — the agent architecture, built over real footage of the code on screen. */
export const Tech: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [190, 240], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const typed = "agent.status = \"in development\"";
  const chars = Math.floor(interpolate(frame, [205, 250], [0, typed.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const cx = 540;
  // vertical layout (y = node centre)
  const Y = { ch: 640, hook: 795, n8n: 950, agent: 1125, out: 1300 };
  return (
    <AbsoluteFill>
      <Clip
        src="clips/presenter.mp4"
        from={2.85}
        duration={SCENES.tech}
        segs={[{ frames: SCENES.tech, rate: 0.45 }]}
        focus={[50, 30]}
        zoom={[1.15, 1.3]}
        blur={10}
        dim={0.55}
        volume={0}
      />
      {/* faint grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(46,230,197,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(46,230,197,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${frame * 0.6}px`,
        }}
      />
      <Finish top={0.6} bottom={0.6} />
      <AbsoluteFill style={{ padding: "270px 150px 0 90px" }}>
        <Kicker num="03" label="المشروع التقني" delay={4} />
        <div style={{ height: 18 }} />
        <Words text="AI_Agent لاستفسارات الأكاديمية" delay={10} size={64} stagger={4} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <Link x1={380} y1={Y.ch + 34} x2={cx} y2={Y.hook - 40} delay={52} />
        <Link x1={700} y1={Y.ch + 34} x2={cx} y2={Y.hook - 40} delay={52} />
        <Link x1={cx} y1={Y.hook + 40} x2={cx} y2={Y.n8n - 40} delay={70} />
        <Link x1={cx} y1={Y.n8n + 40} x2={cx} y2={Y.agent - 70} delay={88} />
        <Link x1={cx - 190} y1={Y.agent} x2={210} y2={Y.agent} delay={120} color={C.cyan} />
        <Link x1={cx} y1={Y.agent + 70} x2={cx} y2={Y.out - 36} delay={140} />
      </svg>
      <Node x={380} y={Y.ch} w={300} delay={36} title="WhatsApp" icon={<ChatIcon color={C.teal} />} />
      <Node x={700} y={Y.ch} w={300} delay={42} title="Telegram" icon={<PlaneIcon color={C.teal} />} />
      <Node x={cx} y={Y.hook} w={360} delay={60} title="Webhooks" sub="استقبال الرسائل" />
      <Node x={cx} y={Y.n8n} w={360} delay={78} title="n8n" sub="مسارات العمل" />
      <Node x={cx + 60} y={Y.agent} w={500} delay={96} title="AI Agent" sub="فهم الاستفسار والرد" big />
      <Node x={175} y={Y.agent} w={240} delay={122} title="Memory" sub="الذاكرة الذكية" accent={C.cyan} />
      <Node x={cx} y={Y.out} w={420} delay={146} title={<span style={{ fontFamily: arabic, fontSize: 38 }}>رد على الاستفسار</span>} />
      {/* built-with tag */}
      <div
        style={{
          position: "absolute",
          top: Y.n8n - 30,
          right: 150,
          transform: "translateY(-50%)",
          opacity: interpolate(frame, [160, 172], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          direction: "rtl",
          fontFamily: arabic,
          fontSize: 26,
          color: C.muted,
          textAlign: "right",
        }}
      >
        يُطوَّر بمساعدة
        <div style={{ fontFamily: latin, fontWeight: 700, fontSize: 34, color: C.white, direction: "ltr" }}>GitHub Copilot</div>
      </div>
      {/* status */}
      <div style={{ position: "absolute", top: 1395, right: 150, left: 90, direction: "rtl" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <DevBadge delay={180} size={32} />
          <div
            style={{
              fontFamily: arabic,
              fontSize: 30,
              color: C.white,
              opacity: interpolate(frame, [190, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            الأسبوع ٢ من ٤
          </div>
        </div>
        <div style={{ marginTop: 18, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", marginRight: 0, background: `linear-gradient(270deg, ${C.amber}, ${C.teal})` }} />
        </div>
        <div style={{ marginTop: 14, direction: "ltr", textAlign: "left", fontFamily: mono, fontSize: 24, color: C.teal, opacity: 0.85 }}>
          {"> "}
          {typed.slice(0, chars)}
          <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>▍</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
