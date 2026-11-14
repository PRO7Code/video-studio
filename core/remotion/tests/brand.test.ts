import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBrandFrom, parseColor, withAlpha, luminance, type RawBrand } from "../src/lib/brandResolve.ts";
import { RAW_BRANDS } from "../src/lib/brands.generated.ts";

const studio: RawBrand = { id: "studio", name: "Studio", nameAr: "الاستوديو", status: "ready",
  colors: { background: "#070C18", primary: "#2EE6C5", secondary: "#38BDF8", accent: "#FFB547", text: "#F5F7FB" } };

test("colour parsing: hex 3/6/8, rgba, invalid", () => {
  assert.deepEqual(parseColor("#fff"), [255, 255, 255, 1]);
  assert.deepEqual(parseColor("#0066CC"), [0, 102, 204, 1]);
  assert.equal(parseColor("#00000080")![3].toFixed(2), "0.50");
  assert.deepEqual(parseColor("rgba(1, 2, 3, 0.5)"), [1, 2, 3, 0.5]);
  assert.equal(parseColor("blue"), null);
  assert.equal(parseColor("rgb(300,0,0)"), null);
  assert.equal(withAlpha("#0066CC", 0.5), "rgba(0,102,204,0.5)");
});
test("missing colours fall back to studio; text derived for contrast", () => {
  const b = resolveBrandFrom({ studio, x: { id: "x", name: "X", nameAr: "س", status: "needs-input", colors: { primary: null } } }, "x");
  assert.equal(b.colors.primary, "#2EE6C5");
  assert.equal(b.colors.background, "#070C18");
  assert.equal(b.isLight, false);
  assert.equal(b.status, "needs-input");
});
test("invalid colour is ignored with a warning, never crashes", () => {
  const b = resolveBrandFrom({ studio, x: { id: "x", name: "X", nameAr: "س", status: "draft", colors: { primary: "not-a-colour" } } }, "x");
  assert.equal(b.colors.primary, "#2EE6C5");
  assert.ok(b.warnings.some((w) => w.includes("invalid colors.primary")));
});
test("unknown brand id → studio with a warning", () => {
  const b = resolveBrandFrom({ studio }, "nope");
  assert.equal(b.id, "studio");
  assert.ok(b.warnings[0].includes("unknown brand"));
});
test("unknown status is treated as needs-input", () => {
  assert.equal(resolveBrandFrom({ studio, x: { ...studio, id: "x", status: "final" } }, "x").status, "needs-input");
});
test("light background (LEF) → dark text, white surface, dark scrim for footage", () => {
  const lef = resolveBrandFrom(RAW_BRANDS, "lef-step");
  assert.equal(lef.isLight, true);
  assert.equal(lef.colors.background, "#F8FAFC");
  assert.equal(lef.colors.primary, "#0066CC");
  assert.equal(lef.colors.secondary, "#FF6600");
  assert.ok(luminance(lef.colors.text) < 0.1, "text must be dark on a light background");
  assert.equal(lef.colors.surface, "#FFFFFF");
  assert.ok(luminance(lef.colors.scrim) < 0.1);
  assert.equal(lef.status, "draft");
  assert.equal(lef.logo, null);
});
test("anan keeps the delivered look (gradient and colours from brand.json)", () => {
  const a = resolveBrandFrom(RAW_BRANDS, "anan");
  assert.deepEqual(a.gradient, ["#2EE6C5", "#38BDF8", "#A78BFA"]);
  assert.equal(a.colors.primary, "#2EE6C5");
});
test("every registered brand resolves without throwing", () => {
  for (const id of Object.keys(RAW_BRANDS)) assert.doesNotThrow(() => resolveBrandFrom(RAW_BRANDS, id), id);
});
