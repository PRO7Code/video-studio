// All durations in frames @30fps. Transitions overlap neighbouring scenes.
export const FPS = 30;
export const T = 12; // transition length
export const SCENES = {
  hook: 96,
  title: 108,
  ideas: 150,
  slide: 156,
  mentor: 72,
  discussion: 150,
  tech: 300,
  outro: 222,
} as const;
const order = Object.keys(SCENES) as (keyof typeof SCENES)[];
export const START: Record<keyof typeof SCENES, number> = {} as never;
let acc = 0;
order.forEach((k, i) => {
  START[k] = acc;
  acc += SCENES[k] - (i < order.length - 1 ? T : 0);
});
export const TOTAL = acc; // 1170 frames = 39s
