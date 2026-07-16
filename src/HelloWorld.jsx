import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Composition de base issue du template Hello World de Remotion.
export const HelloWorld = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#F4F7FB",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: '"Segoe UI", system-ui, sans-serif',
          fontSize: 100,
          fontWeight: 700,
          color: "#2A3B4D",
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        Hello World
      </div>
    </AbsoluteFill>
  );
};
