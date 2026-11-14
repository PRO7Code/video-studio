import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { arabic, latin } from "./theme";
import { useBrand, brandGradient } from "./brand";

/**
 * Data-driven animated architecture / process diagram (from the Anan "technical project" scene).
 * Nodes pop in at their delay; edges draw then carry travelling packets. Positions are output px (node centre).
 * Use for: AI-agent flows, app walkthrough steps, tool comparisons, "how it works" segments.
 */
export type FlowNode = { id: string; x: number; y: number; w: number; title: string; sub?: string; delay: number; big?: boolean; accent?: "primary" | "secondary" | "accent"; icon?: React.ReactNode; arabicTitle?: boolean };
export type FlowEdge = { from: string; to: string; delay: number; accent?: "primary" | "secondary" | "accent" };

const NodeBox: React.FC<{ n: FlowNode }> = ({ n }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = useBrand();
  const accent = b.colors[n.accent ?? "primary"];
  const p = spring({ frame: frame - n.delay, fps, config: { damping: 15, stiffness: 150 } });
  const pulse = n.big ? 0.6 + 0.4 * Math.sin((frame - n.delay) / 8) : 0.4;
  return (
    <div style={{ position: "absolute", left: n.x - n.w / 2, top: n.y, width: n.w, transform: `translateY(-50%) scale(${0.8 + 0.2 * p})`, opacity: p,
      padding: n.big ? "30px 26px" : "20px 22px", borderRadius: n.big ? 36 : 26, background: `${b.colors.ink}e0`,
      border: `${n.big ? 3 : 2}px solid ${accent}`, boxShadow: `0 0 ${n.big ? 60 * pulse : 18}px ${accent}66`, textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {n.icon}
        <div style={{ fontFamily: n.arabicTitle ? arabic : latin, fontWeight: 700, fontSize: n.big ? 62 : 40, letterSpacing: n.arabicTitle ? 0 : -1, direction: n.arabicTitle ? "rtl" : "ltr",
          ...(n.big ? { backgroundImage: brandGradient(b), WebkitBackgroundClip: "text", color: "transparent" } : { color: b.colors.text }) }}>{n.title}</div>
      </div>
      {n.sub ? <div style={{ fontFamily: arabic, fontSize: n.big ? 32 : 27, color: b.colors.muted, direction: "rtl" }}>{n.sub}</div> : null}
    </div>
  );
};

const Edge: React.FC<{ a: FlowNode; z: FlowNode; e: FlowEdge }> = ({ a, z, e }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const color = b.colors[e.accent ?? "primary"];
  // connect box edges: vertical if mostly vertical, else horizontal
  const vertical = Math.abs(z.y - a.y) >= Math.abs(z.x - a.x);
  const hA = a.big ? 70 : 40, hZ = z.big ? 70 : 40;
  const [x1, y1, x2, y2] = vertical
    ? [a.x, a.y + Math.sign(z.y - a.y) * hA, z.x, z.y - Math.sign(z.y - a.y) * hZ]
    : [a.x + Math.sign(z.x - a.x) * a.w / 2, a.y, z.x - Math.sign(z.x - a.x) * z.w / 2, z.y];
  const d = interpolate(frame - e.delay, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <g opacity={d > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={0.55} strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - d)} />
      {d >= 1 ? [0, 0.5].map((o, i) => { const t = ((frame - e.delay) / 26 + o) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={7} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />; }) : null}
    </g>
  );
};

export const FlowDiagram: React.FC<{ nodes: FlowNode[]; edges: FlowEdge[]; width?: number; height?: number }> = ({ nodes, edges, width = 1080, height = 1920 }) => {
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {edges.map((e, i) => (by[e.from] && by[e.to] ? <Edge key={i} a={by[e.from]} z={by[e.to]} e={e} /> : null))}
      </svg>
      {nodes.map((n) => <NodeBox key={n.id} n={n} />)}
    </>
  );
};
