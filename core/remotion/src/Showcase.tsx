import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BrandProvider, resolveBrand, useBrand } from "./lib/brand";
import { Words, Kicker, Chip, DevBadge } from "./lib/Type";
import { FlowDiagram } from "./lib/FlowDiagram";
import { Chapters } from "./lib/Chapters";
import { Finish } from "./lib/Overlays";

/** Media-free test of the core library under a brand: use it to review a brand.json before real projects. */
const Inner: React.FC = () => {
  const b = useBrand();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${b.colors.secondary}33, ${b.colors.ink} 70%)` }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${b.colors.primary}10 1px, transparent 1px), linear-gradient(90deg, ${b.colors.primary}10 1px, transparent 1px)`, backgroundSize: "60px 60px", backgroundPosition: `0 ${f * 0.6}px` }} />
      <Chapters acts={[{ label: "الفكرة", from: 0, to: 60 }, { label: "الطريقة", from: 60, to: 120 }, { label: "النتيجة", from: 120, to: 180 }]} />
      <AbsoluteFill style={{ padding: "280px 150px 0 90px" }}>
        <Kicker num="01" label={b.nameAr} delay={2} />
        <div style={{ height: 18 }} />
        <Words text="قالب الاستوديو مع AI_Agent" delay={8} size={70} />
      </AbsoluteFill>
      <FlowDiagram
        nodes={[
          { id: "in", x: 540, y: 720, w: 380, title: "فكرة", arabicTitle: true, sub: "موضوع أو منتج", delay: 30 },
          { id: "tool", x: 540, y: 900, w: 380, title: "Remotion", sub: "قوالب وهوية", delay: 45 },
          { id: "ai", x: 600, y: 1090, w: 460, title: "AI Agent", sub: "سيناريو ولقطات", delay: 60, big: true },
          { id: "mem", x: 175, y: 1090, w: 230, title: "Brand", sub: "brand.json", delay: 75, accent: "secondary" },
          { id: "out", x: 540, y: 1280, w: 400, title: "MP4", sub: "معاينة ثم تصدير", delay: 90 },
        ]}
        edges={[{ from: "in", to: "tool", delay: 40 }, { from: "tool", to: "ai", delay: 55 }, { from: "mem", to: "ai", delay: 80, accent: "secondary" }, { from: "ai", to: "out", delay: 95 }]}
      />
      <div style={{ position: "absolute", top: 1400, right: 150, left: 90, direction: "rtl", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <DevBadge delay={100} size={30} label={b.status === "ready" ? "هوية جاهزة" : "هوية تنتظر بيانات العميل"} />
        <Chip delay={110} size={30}>primary</Chip>
        <Chip delay={115} size={30} accent={b.colors.secondary}>secondary</Chip>
      </div>
      <Finish top={0.2} bottom={0.3} />
    </AbsoluteFill>
  );
};

export const Showcase: React.FC<{ brand: string }> = ({ brand }) => (
  <BrandProvider id={brand}>
    <Inner />
  </BrandProvider>
);
export const showcaseBrandStatus = (id: string) => resolveBrand(id).status;
