import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { useBrand } from "./brand";

/**
 * Point at something REAL inside footage (slide title, screen element, product detail) – from the Anan reel.
 * Geometry: a landscape/portrait source shown with object-fit:cover + a zoom around `origin` (output px).
 * mapSourceToFrame converts source pixels to output pixels at zoom s, so the box tracks the push-in exactly.
 */
export type CoverGeom = { srcW: number; srcH: number; outW?: number; outH?: number; cropX?: number; cropY?: number; origin: [number, number] };

export const mapSourceToFrame = (g: CoverGeom, x: number, y: number, s: number): [number, number] => {
  const outW = g.outW ?? 1080, outH = g.outH ?? 1920;
  const k = Math.max(outW / g.srcW, outH / g.srcH);
  const X = (x - (g.cropX ?? 0)) * k;
  const Y = (y - (g.cropY ?? 0)) * k;
  return [g.origin[0] + (X - g.origin[0]) * s, g.origin[1] + (Y - g.origin[1]) * s];
};

/** cropX for objectPosition: the % value to pass to <Clip focus> so the window starts at cropX source px */
export const focusForCrop = (g: CoverGeom) => {
  const outW = g.outW ?? 1080, outH = g.outH ?? 1920;
  const k = Math.max(outW / g.srcW, outH / g.srcH);
  return ((g.cropX ?? 0) / Math.max(1, g.srcW - outW / k)) * 100;
};

export const HighlightBox: React.FC<{
  geom: CoverGeom;
  box: { x0: number; y0: number; x1: number; y1: number }; // source px
  zoom: number; // current zoom (same value the Clip uses)
  drawFrom?: number;
  drawFrames?: number;
  leaderToY?: number; // draw a dashed leader line down to this output y (e.g. a caption card)
  pad?: number;
}> = ({ geom, box, zoom, drawFrom = 20, drawFrames = 20, leaderToY, pad = 18 }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const [x0, y0] = mapSourceToFrame(geom, box.x0, box.y0, zoom);
  const [x1, y1] = mapSourceToFrame(geom, box.x1, box.y1, zoom);
  const d = interpolate(frame, [drawFrom, drawFrom + drawFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2, per = 2 * (w + h);
  return (
    <svg width={geom.outW ?? 1080} height={geom.outH ?? 1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={x0 - pad} y={y0 - pad} width={w} height={h} rx={14} fill="none" stroke={b.colors.primary} strokeWidth={4}
        strokeDasharray={per} strokeDashoffset={per * (1 - d)} style={{ filter: `drop-shadow(0 0 12px ${b.colors.primary})` }} />
      {leaderToY !== undefined ? (
        <line x1={(x0 + x1) / 2} y1={y1 + pad} x2={(x0 + x1) / 2} y2={y1 + pad + (leaderToY - (y1 + pad)) * d}
          stroke={b.colors.primary} strokeWidth={3} strokeDasharray="8 10" opacity={0.9} />
      ) : null}
    </svg>
  );
};
