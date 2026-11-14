// Pure brand resolution (no React) so it can be unit-tested with `node --test`.
export type ColorKey = "background" | "surface" | "primary" | "secondary" | "accent" | "text" | "onMedia" | "muted";
export type RawBrand = {
  id: string; name: string; nameAr: string; status: string;
  colors: Partial<Record<ColorKey, string | null>>;
  gradient?: string[] | null;
  fonts?: Partial<Record<"arabic" | "latin" | "mono", string>>;
  logo?: string | null;
  links?: Record<string, string> | null; // e.g. { web: "lef.one", tiktok: "@lef.one" } — only real, owner-provided
};
export type BrandColors = Record<ColorKey, string> & { scrim: string; line: string };
export type Brand = {
  id: string; name: string; nameAr: string;
  status: "ready" | "draft" | "needs-input";
  colors: BrandColors; gradient: string[];
  fonts: { arabic: string; latin: string; mono: string };
  logo: string | null;
  links: Record<string, string>;
  isLight: boolean; // background is light → graphic scenes use dark text
  warnings: string[];
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i;

export const parseColor = (c: string | null | undefined): [number, number, number, number] | null => {
  if (!c) return null;
  const s = c.trim();
  if (HEX.test(s)) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  const m = s.match(RGBA);
  if (m) {
    const v = [m[1], m[2], m[3]].map(Number);
    if (v.some((x) => x > 255)) return null;
    return [v[0], v[1], v[2], m[4] === undefined ? 1 : Math.min(1, Number(m[4]))];
  }
  return null;
};
export const isValidColor = (c: unknown) => typeof c === "string" && parseColor(c) !== null;

/** colour with a new alpha, as rgba() — works for hex and rgba inputs */
export const withAlpha = (c: string, a: number) => {
  const p = parseColor(c) ?? [0, 0, 0, 1];
  return `rgba(${p[0]},${p[1]},${p[2]},${Math.max(0, Math.min(1, a))})`;
};
export const luminance = (c: string) => {
  const p = parseColor(c);
  if (!p) return 0;
  const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
};

/**
 * Resolve a brand: invalid/missing values fall back to the studio brand; text/surface/muted/onMedia are DERIVED
 * for contrast when not provided (technical readability defaults, not brand colours). Unknown id → studio.
 */
export const resolveBrandFrom = (all: Record<string, RawBrand>, id: string): Brand => {
  const warnings: string[] = [];
  const base = all.studio;
  if (!base) throw new Error("brands/studio is required");
  let raw = all[id];
  if (!raw) { warnings.push(`unknown brand "${id}" → studio`); raw = base; }
  const pick = (k: ColorKey): string | null => {
    const v = raw.colors?.[k];
    if (v && isValidColor(v)) return v;
    if (v) warnings.push(`invalid colors.${k} "${v}" ignored`);
    return null;
  };
  const fromBase = (k: ColorKey) => (base.colors[k] && isValidColor(base.colors[k]) ? (base.colors[k] as string) : "#000000");
  const background = pick("background") ?? fromBase("background");
  const isLight = luminance(background) > 0.5;
  const primary = pick("primary") ?? fromBase("primary");
  const secondary = pick("secondary") ?? fromBase("secondary");
  const accent = pick("accent") ?? fromBase("accent");
  const text = pick("text") ?? (isLight ? "#0F172A" : fromBase("text"));
  const onMedia = pick("onMedia") ?? "#FFFFFF";
  const surface = pick("surface") ?? (isLight ? "#FFFFFF" : withAlpha(background, 0.88));
  const muted = pick("muted") ?? withAlpha(text, 0.68);
  const scrim = isLight ? "#0B1220" : background; // dark overlay for legibility of text over footage
  const line = withAlpha(text, isLight ? 0.14 : 0.22);
  const grad = raw.gradient && raw.gradient.length >= 2 && raw.gradient.every(isValidColor) ? raw.gradient : [primary, secondary];
  const status = (["ready", "draft", "needs-input"].includes(raw.status) ? raw.status : "needs-input") as Brand["status"];
  return {
    id: raw.id, name: raw.name, nameAr: raw.nameAr, status,
    colors: { background, surface, primary, secondary, accent, text, onMedia, muted, scrim, line },
    gradient: grad,
    fonts: { arabic: "Readex Pro", latin: "Space Grotesk", mono: "JetBrains Mono", ...(base.fonts ?? {}), ...(raw.fonts ?? {}) },
    logo: raw.logo ?? null, links: raw.links ?? {}, isLight, warnings,
  };
};
