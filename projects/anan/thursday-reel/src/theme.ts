import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (variable fonts, 300–700) so rendering works offline.
const AR = "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC";
const LAT = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+25CD";
export const arabic = "Readex Pro";
export const latin = "Space Grotesk";
export const mono = "JetBrains Mono";
loadFont({ family: arabic, url: staticFile("fonts/readex-arabic.woff2"), weight: "300 700", unicodeRange: AR });
loadFont({ family: arabic, url: staticFile("fonts/readex-latin.woff2"), weight: "300 700", unicodeRange: LAT });
loadFont({ family: latin, url: staticFile("fonts/grotesk.woff2"), weight: "300 700" });
loadFont({ family: mono, url: staticFile("fonts/mono.woff2"), weight: "100 800" });

export const C = {
  ink: "#070C18",
  navy: "#0B1530",
  teal: "#2EE6C5",
  cyan: "#38BDF8",
  amber: "#FFB547",
  white: "#F5F7FB",
  muted: "rgba(245,247,251,0.72)",
};

export const techGradient = `linear-gradient(100deg, ${C.teal} 0%, ${C.cyan} 55%, #A78BFA 100%)`;

// Safe zone for TikTok / Reels / Snapchat (1080x1920)
export const SAFE = { top: 250, bottom: 1480, left: 90, right: 150 };
