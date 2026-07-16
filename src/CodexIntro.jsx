import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  // Audio,
  // staticFile,
} from "remotion";

const COLORS = {
  bg: "#F4F7FB",
  ink: "#2A3B4D",
  soft: "#6B7C8F",
  blue: "#8FB8DE",
  sage: "#A8C3A0",
  peach: "#F0B99A",
  amber: "#E8B96A",
  white: "#FFFFFF",
};

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

/**
 * FadeUp — fondu + montée douce (translateY) à l'entrée d'un élément.
 * `delay` décale l'apparition pour créer un effet d'escalier.
 */
const FadeUp = ({ children, delay = 0, distance = 40, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;

  const opacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(local, [0, 20], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...style, opacity, transform: `translateY(${translateY}px)` }}>
      {children}
    </div>
  );
};

/**
 * PopScale — effet spring pour les scales (apparition des cartes/cercles).
 */
const usePopScale = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.6 },
  });
  return scale;
};

const SceneTitle = ({ children, color = COLORS.ink }) => (
  <FadeUp
    style={{
      position: "absolute",
      top: 90,
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: FONT,
      fontSize: 58,
      fontWeight: 700,
      color,
      letterSpacing: -0.5,
    }}
  >
    {children}
  </FadeUp>
);

/* ------------------------------------------------------------------ */
/* Scène 1 — Le problème : l'information est éparpillée                 */
/* ------------------------------------------------------------------ */

const DocCard = ({ index, delay }) => {
  const frame = useCurrentFrame();
  const scale = usePopScale(delay);
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Positions dispersées et légèrement inclinées.
  const layout = [
    { x: 420, y: 360, rot: -8 },
    { x: 760, y: 300, rot: 5 },
    { x: 1120, y: 380, rot: -4 },
    { x: 520, y: 640, rot: 7 },
    { x: 900, y: 660, rot: -6 },
    { x: 1240, y: 640, rot: 9 },
  ][index];

  // Léger flottement continu.
  const float = Math.sin((frame - delay) / 18 + index) * 8;

  return (
    <div
      style={{
        position: "absolute",
        left: layout.x,
        top: layout.y + float,
        width: 200,
        height: 260,
        borderRadius: 14,
        background: COLORS.white,
        boxShadow: "0 18px 40px rgba(42,59,77,0.18)",
        transform: `rotate(${layout.rot}deg) scale(${scale})`,
        opacity,
        padding: 22,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: COLORS.blue,
          marginBottom: 18,
        }}
      />
      {[0.95, 0.75, 0.85, 0.6, 0.9, 0.5].map((w, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 6,
            background: COLORS.bg,
            marginBottom: 12,
            width: `${w * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

const Scene1 = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Son de transition au début de la scène */}
      {/* <Audio src={staticFile("transition.mp3")} /> */}

      <SceneTitle>Aujourd'hui : l'information est éparpillée</SceneTitle>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          {/* Son "pop" à l'apparition de chaque carte */}
          {/* <Audio src={staticFile("pop.mp3")} startFrom={0} /> */}
          <DocCard index={i} delay={30 + i * 14} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 2 — Une démarche en 3 temps                                   */
/* ------------------------------------------------------------------ */

const StepCard = ({ icon, title, subtitle, color, delay }) => {
  const scale = usePopScale(delay);
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: 320,
        height: 380,
        borderRadius: 24,
        background: COLORS.white,
        boxShadow: "0 20px 50px rgba(42,59,77,0.14)",
        transform: `scale(${scale})`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        boxSizing: "border-box",
        borderTop: `10px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 96, marginBottom: 24 }}>{icon}</div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 700,
          color: COLORS.ink,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 26,
          color: COLORS.soft,
          textAlign: "center",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

const Arrow = ({ delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 72,
        fontWeight: 300,
        color: COLORS.soft,
        opacity,
        margin: "0 8px",
      }}
    >
      →
    </div>
  );
};

const Scene2 = () => {
  const steps = [
    { icon: "💬", title: "Entretien", subtitle: "avec le secteur", color: COLORS.blue },
    { icon: "🔍", title: "Analyse", subtitle: "des procédures", color: COLORS.sage },
    { icon: "📚", title: "Centralisation", subtitle: "sur SharePoint", color: COLORS.amber },
  ];
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Son de transition au début de la scène */}
      {/* <Audio src={staticFile("transition.mp3")} /> */}

      <SceneTitle>Une démarche en 3 temps</SceneTitle>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        {steps.map((s, i) => (
          <React.Fragment key={s.title}>
            {i > 0 && <Arrow delay={40 + i * 25} />}
            {/* Son "pop" à l'apparition de chaque carte */}
            {/* <Audio src={staticFile("pop.mp3")} /> */}
            <StepCard {...s} delay={20 + i * 25} />
          </React.Fragment>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scènes 3 & 4 — Cercles colorés                                      */
/* ------------------------------------------------------------------ */

const CircleItem = ({ icon, label, color, delay }) => {
  const scale = usePopScale(delay);
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 50px",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          boxShadow: `0 20px 45px ${color}66`,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 38,
          fontWeight: 600,
          color: COLORS.ink,
          marginTop: 30,
          textAlign: "center",
          maxWidth: 300,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const CircleScene = ({ title, items }) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    {/* Son de transition au début de la scène */}
    {/* <Audio src={staticFile("transition.mp3")} /> */}

    <SceneTitle>{title}</SceneTitle>

    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {/* Son "pop" à l'apparition de chaque cercle */}
          {/* <Audio src={staticFile("pop.mp3")} /> */}
          <CircleItem {...it} delay={20 + i * 22} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);

const Scene3 = () => (
  <CircleScene
    title="Une démarche adaptable à chaque secteur"
    items={[
      { icon: "🗂️", label: "Chaque secteur", color: COLORS.blue },
      { icon: "📚", label: "Son propre Codex", color: COLORS.sage },
      { icon: "✅", label: "Une info centralisée", color: COLORS.peach },
    ]}
  />
);

const Scene4 = () => (
  <CircleScene
    title="Des bénéfices concrets"
    items={[
      { icon: "💡", label: "Clarté", color: COLORS.blue },
      { icon: "🎯", label: "Autonomie", color: COLORS.sage },
      { icon: "⏱️", label: "Gain de temps", color: COLORS.amber },
    ]}
  />
);

/* ------------------------------------------------------------------ */
/* Scène 5 — Conclusion (fond sombre)                                  */
/* ------------------------------------------------------------------ */

const Scene5 = () => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.ink,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Son de transition au début de la scène */}
      {/* <Audio src={staticFile("transition.mp3")} /> */}

      <FadeUp delay={6}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Toute l'information,
        </div>
      </FadeUp>
      <FadeUp delay={24}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: COLORS.blue,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          au même endroit.
        </div>
      </FadeUp>
      <FadeUp delay={48}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 32,
            fontWeight: 400,
            color: COLORS.soft,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Codex ASE — Hébergement ESMS
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const CodexIntro = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={180}>
        <Scene1 />
      </Sequence>
      <Sequence from={180} durationInFrames={180}>
        <Scene2 />
      </Sequence>
      <Sequence from={360} durationInFrames={150}>
        <Scene3 />
      </Sequence>
      <Sequence from={510} durationInFrames={150}>
        <Scene4 />
      </Sequence>
      <Sequence from={660} durationInFrames={90}>
        <Scene5 />
      </Sequence>
    </AbsoluteFill>
  );
};
