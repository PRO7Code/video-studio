import { START } from "./timeline";

/** Sound-design cue sheet: every effect sits on the frame of the visual event it belongs to. */
export type Cue = { at: number; file: string; volume: number };

const s = START;
const typing: Cue[] = Array.from({ length: 31 }, (_, i) => ({
  at: s.tech + 205 + Math.round((i * 45) / 31),
  file: `key${(i % 4) + 1}`,
  volume: 0.12 + ((i * 7) % 5) * 0.015,
}));

export const CUES: Cue[] = [
  // Hook
  { at: 0, file: "hit", volume: 0.5 },
  { at: 4, file: "pop", volume: 0.22 }, // "قيد التطوير" badge
  { at: 6, file: "swish", volume: 0.3 }, // "AI Agent"
  // Transitions (whoosh peak lands mid-transition)
  { at: s.title - 6, file: "whoosh", volume: 0.32 },
  { at: s.title + 30, file: "tick", volume: 0.2 }, // Fluent × Anan lockup
  { at: s.ideas - 6, file: "whoosh", volume: 0.32 },
  { at: s.ideas + 4, file: "tick", volume: 0.22 }, // kicker 01
  { at: s.slide - 5, file: "whoosh-soft", volume: 0.25 },
  { at: s.slide + 20, file: "scan", volume: 0.16 }, // highlight box draws around the real slide title
  { at: s.slide + 34, file: "pop-low", volume: 0.22 }, // card
  { at: s.slide + 48, file: "pop", volume: 0.2 },
  { at: s.slide + 53, file: "pop", volume: 0.2 },
  { at: s.slide + 58, file: "pop", volume: 0.2 },
  { at: s.mentor - 6, file: "whoosh", volume: 0.32 },
  { at: s.mentor + 2, file: "tick", volume: 0.22 }, // kicker 02
  { at: s.discussion - 5, file: "whoosh-soft", volume: 0.22 },
  { at: s.discussion + 40, file: "pop-low", volume: 0.25 }, // "عمل جماعي"
  { at: s.discussion + 68, file: "pop", volume: 0.18 },
  { at: s.discussion + 74, file: "pop", volume: 0.18 },
  { at: s.tech - 6, file: "whoosh", volume: 0.34 },
  { at: s.tech + 4, file: "tick", volume: 0.22 }, // kicker 03
  // Architecture nodes
  { at: s.tech + 36, file: "pop", volume: 0.2 }, // WhatsApp
  { at: s.tech + 42, file: "pop", volume: 0.2 }, // Telegram
  { at: s.tech + 60, file: "pop", volume: 0.2 }, // Webhooks
  { at: s.tech + 78, file: "pop", volume: 0.2 }, // n8n
  { at: s.tech + 96, file: "hit", volume: 0.3 }, // AI Agent
  { at: s.tech + 122, file: "pop-low", volume: 0.2 }, // Memory
  { at: s.tech + 146, file: "pop", volume: 0.2 }, // reply
  { at: s.tech + 160, file: "tick", volume: 0.2 }, // GitHub Copilot
  { at: s.tech + 180, file: "pop-low", volume: 0.24 }, // "قيد التطوير"
  ...typing,
  // Outro
  { at: s.outro - 5, file: "whoosh-soft", volume: 0.24 },
  { at: s.outro + 70, file: "tick", volume: 0.2 }, // lockup
];
