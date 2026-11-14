import React, { createContext, useContext } from "react";
import { RAW_BRANDS } from "./brands.generated";
import { resolveBrandFrom, withAlpha, type Brand } from "./brandResolve";

export type { Brand } from "./brandResolve";
export { withAlpha } from "./brandResolve";

// Registered brands come from brands/<id>/brand.json via scripts/brands.mjs (no manual imports).
export const BRAND_IDS = Object.keys(RAW_BRANDS);
export const resolveBrand = (id: string): Brand => resolveBrandFrom(RAW_BRANDS, id);

export const BrandContext = createContext<Brand>(resolveBrand("studio"));
export const BrandProvider: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const b = resolveBrand(id);
  for (const w of b.warnings) console.warn(`[brand:${id}] ${w}`);
  return React.createElement(BrandContext.Provider, { value: b }, children);
};
export const useBrand = () => useContext(BrandContext);
export const brandGradient = (b: Brand, angle = 100) =>
  `linear-gradient(${angle}deg, ${b.gradient.map((c, i) => `${c} ${Math.round((i / (b.gradient.length - 1)) * 100)}%`).join(", ")})`;

/**
 * Surface: "media" = text sits over footage (onMedia colour + dark scrim) – the default;
 * "graphic" = text sits on the brand background (text colour; light brands get dark text).
 */
export type SurfaceMode = "media" | "graphic";
const SurfaceContext = createContext<SurfaceMode>("media");
export const Surface: React.FC<{ mode: SurfaceMode; children: React.ReactNode }> = ({ mode, children }) =>
  React.createElement(SurfaceContext.Provider, { value: mode }, children);
export const useSurface = () => useContext(SurfaceContext);
/** the readable text colour for the current surface */
export const useInk = () => {
  const b = useBrand();
  const s = useSurface();
  return s === "media" ? b.colors.onMedia : b.colors.text;
};
export const useMutedInk = () => {
  const b = useBrand();
  return useSurface() === "media" ? withAlpha(b.colors.onMedia, 0.72) : b.colors.muted;
};
