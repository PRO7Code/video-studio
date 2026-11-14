import React from "react";
import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

type P = Record<string, never>;

/** Push-through zoom with motion blur and a soft light bloom. */
const ZoomBlur: React.FC<TransitionPresentationComponentProps<P>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  const scale = entering ? 1.18 - 0.18 * p : 1 + 0.14 * p;
  const blur = entering ? (1 - p) * 18 : p * 18;
  const bloom = entering ? 1 + (1 - p) * 0.35 : 1 + p * 0.35;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        filter: `blur(${blur}px) brightness(${bloom})`,
        opacity: entering ? Math.min(1, p * 1.6) : 1,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const zoomBlur = (): TransitionPresentation<P> => ({ component: ZoomBlur, props: {} });
