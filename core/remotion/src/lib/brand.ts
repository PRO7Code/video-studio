import React, { createContext, useContext } from "react";
import studio from "../../../../brands/studio/brand.json";
import anan from "../../../../brands/anan/brand.json";
import lefStep from "../../../../brands/lef-step/brand.json";
import techChannel from "../../../../brands/tech-channel/brand.json";
import rimadi from "../../../../brands/rimadi-lounge/brand.json";
import hanem from "../../../../brands/hanem-cafe/brand.json";
import hoyo from "../../../../brands/hoyo-burger/brand.json";
import sand from "../../../../brands/sand/brand.json";

/** Brand system: every template reads colours/fonts from the active brand (brands/<id>/brand.json). */
export type BrandColors = { ink: string; primary: string; secondary: string; accent: string; text: string; muted: string };
export type Brand = {
  id: string;
  name: string;
  nameAr: string;
  status: "ready" | "needs-input";
  colors: BrandColors;
  fonts: { arabic: string; latin: string; mono: string };
  logo: string | null;
};
type RawBrand = Omit<Brand, "colors" | "status"> & { status: string; colors: Record<string, string | null> };

const RAW: Record<string, RawBrand> = {
  studio, anan, "lef-step": lefStep, "tech-channel": techChannel, "rimadi-lounge": rimadi, "hanem-cafe": hanem,
  "hoyo-burger": hoyo, sand,
} as unknown as Record<string, RawBrand>;

export const BRAND_IDS = Object.keys(RAW);

/** Missing values (null) fall back to the studio brand, so a "needs-input" brand still renders. */
export const resolveBrand = (id: string): Brand => {
  const base = RAW.studio;
  const b = RAW[id] ?? base;
  const colors = { ...base.colors } as Record<string, string | null>;
  for (const [k, v] of Object.entries(b.colors)) if (v) colors[k] = v;
  return { ...b, status: b.status as Brand["status"], colors: colors as unknown as BrandColors, fonts: { ...base.fonts, ...b.fonts } };
};

export const BrandContext = createContext<Brand>(resolveBrand("studio"));
export const BrandProvider: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) =>
  React.createElement(BrandContext.Provider, { value: resolveBrand(id) }, children);
export const useBrand = () => useContext(BrandContext);
export const brandGradient = (b: Brand) =>
  `linear-gradient(100deg, ${b.colors.primary} 0%, ${b.colors.secondary} 55%, #A78BFA 100%)`;
