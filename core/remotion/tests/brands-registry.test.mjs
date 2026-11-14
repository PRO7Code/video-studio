import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateBrand } from "../../../scripts/brands.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../scripts/brands.mjs");
const ok = { id: "x", name: "X", nameAr: "س", status: "draft", colors: { primary: "#0066CC" }, fonts: { arabic: "Readex Pro" }, logo: null };

test("valid draft brand passes with warnings only", () => {
  const r = validateBrand("x", ok);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.length > 0);
});
test("rejects wrong id, bad colour, unknown key, unbundled font, bad status", () => {
  assert.ok(validateBrand("y", ok).errors.some((e) => e.includes("folder name")));
  assert.ok(validateBrand("x", { ...ok, colors: { primary: "blue" } }).errors.some((e) => e.includes("valid hex")));
  assert.ok(validateBrand("x", { ...ok, colors: { ink: "#000" } }).errors.some((e) => e.includes("unknown colour key")));
  assert.ok(validateBrand("x", { ...ok, fonts: { arabic: "Cairo" } }).errors.some((e) => e.includes("not bundled")));
  assert.ok(validateBrand("x", { ...ok, status: "final" }).errors.some((e) => e.includes("status")));
});
test('"ready" requires the core colours', () => {
  assert.ok(validateBrand("x", { ...ok, status: "ready" }).errors.some((e) => e.includes("requires colors.background")));
});
test("generated registry is up to date with brands/*/brand.json", () => {
  assert.doesNotThrow(() => execFileSync("node", [SCRIPT, "--check"], { stdio: "pipe" }));
});
