import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
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

// Fichiers son (dans public/).
const SND_SWOOSH = "mixkit-short-wind-swoosh-1461.wav"; // transition de scène
const SND_POP = "mixkit-message-pop-alert-2354.mp3"; // apparition carte/cercle
const SND_WHOOSH = "mixkit-arrow-whoosh-1491.wav"; // accent accueil/conclusion
const SND_MUSIC = "mixkit-what-about-action-474.mp3"; // musique de fond
const SND_CLICK = "mixkit-fast-double-click-on-mouse-275.wav"; // zoom carte

// Son de transition joué au début d'une scène.
const TransitionSound = () => <Audio src={staticFile(SND_SWOOSH)} />;

// Son "pop" calé sur l'apparition d'un élément (à `delay` frames du début).
const PopSound = ({ delay }) => (
  <Sequence from={delay} layout="none">
    <Audio src={staticFile(SND_POP)} />
  </Sequence>
);

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
      <TransitionSound />

      <SceneTitle>Aujourd'hui : l'information est éparpillée</SceneTitle>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          {/* Son "pop" à l'apparition de chaque carte */}
          <PopSound delay={30 + i * 14} />
          <DocCard index={i} delay={30 + i * 14} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 2 — Une démarche en 3 temps                                   */
/* ------------------------------------------------------------------ */

// Décalage horizontal (px) pour amener la carte "Entretien" au centre de l'écran.
const ENTRETIEN_DX = 408;

const StepCard = ({
  icon,
  title,
  subtitle,
  color,
  delay,
  highlight = 0,
  highlighted = false,
}) => {
  const scale = usePopScale(delay);
  const frame = useCurrentFrame();
  const appearOpacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let transform;
  let opacity = appearOpacity;
  if (highlighted) {
    // La carte grossit et se déplace vers le centre de l'écran.
    const s = scale * (1 + 0.35 * highlight);
    const dx = ENTRETIEN_DX * highlight;
    const dy = -110 * highlight;
    transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  } else {
    // Les autres cartes s'estompent et glissent hors champ.
    opacity = appearOpacity * (1 - highlight);
    const dx = 260 * highlight;
    transform = `translateX(${dx}px) scale(${scale})`;
  }

  return (
    <div
      style={{
        position: "relative",
        zIndex: highlighted ? 10 : 1,
        width: 320,
        height: 380,
        borderRadius: 24,
        background: COLORS.white,
        boxShadow: "0 20px 50px rgba(42,59,77,0.14)",
        transform,
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

const Arrow = ({ delay, highlight = 0 }) => {
  const frame = useCurrentFrame();
  const appearOpacity = interpolate(frame - delay, [0, 15], [0, 1], {
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
        opacity: appearOpacity * (1 - highlight),
        margin: "0 8px",
      }}
    >
      →
    </div>
  );
};

// Les 3 points détaillés affichés pendant le zoom sur "Entretien".
const ENTRETIEN_POINTS = [
  "Bilan des problèmes rencontrés",
  "Documents et outils utilisés",
  "Qui sont les usagers du Codex",
];

const HighlightPoints = ({ frame, highlight, startFrame }) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "flex-end",
      paddingBottom: 150,
      flexDirection: "column",
      opacity: highlight,
    }}
  >
    {ENTRETIEN_POINTS.map((p, i) => {
      const local = frame - startFrame - i * 12;
      const o = interpolate(local, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const ty = interpolate(local, [0, 15], [26, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <div
          key={p}
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 500,
            color: COLORS.ink,
            marginBottom: 22,
            opacity: o,
            transform: `translateY(${ty}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ color: COLORS.blue, fontSize: 30 }}>●</span>
          {p}
        </div>
      );
    })}
  </AbsoluteFill>
);

// Temps fort de la scène 2 : zoom sur "Entretien" + 3 points + dézoom.
const HL_IN = 100; // début du zoom
const HL_HOLD = 125; // zoom complet (les points commencent à apparaître)
const HL_OUT = 205; // début du dézoom
const HL_END = 230; // retour à la vue normale

const Scene2 = () => {
  const frame = useCurrentFrame();
  const steps = [
    { icon: "💬", title: "Entretien", subtitle: "avec le secteur", color: COLORS.blue },
    { icon: "🔍", title: "Analyse", subtitle: "des procédures", color: COLORS.sage },
    { icon: "📚", title: "Centralisation", subtitle: "sur SharePoint", color: COLORS.amber },
  ];

  // Progression du zoom : 0 (normal) → 1 (zoomé) → 0 (retour).
  const highlight = interpolate(
    frame,
    [HL_IN, HL_HOLD, HL_OUT, HL_END],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Son de transition au début de la scène */}
      <TransitionSound />

      {/* Double-click au démarrage du zoom */}
      <Sequence from={HL_IN} layout="none">
        <Audio src={staticFile(SND_CLICK)} />
      </Sequence>

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
            {i > 0 && <Arrow delay={40 + i * 25} highlight={highlight} />}
            {/* Son "pop" à l'apparition de chaque carte */}
            <PopSound delay={20 + i * 25} />
            <StepCard
              {...s}
              delay={20 + i * 25}
              highlight={highlight}
              highlighted={i === 0}
            />
          </React.Fragment>
        ))}
      </AbsoluteFill>

      {/* 3 points détaillés en cascade pendant le zoom */}
      <HighlightPoints frame={frame} highlight={highlight} startFrame={HL_HOLD} />
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
    <TransitionSound />

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
          <PopSound delay={20 + i * 22} />
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
      {/* Son de transition + whoosh d'accentuation */}
      <TransitionSound />
      <Audio src={staticFile(SND_WHOOSH)} />

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
/* Scène d'accueil — Bienvenue                                         */
/* ------------------------------------------------------------------ */

const SceneAccueil = () => {
  const scale = usePopScale(0);
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Son de transition + whoosh d'accentuation */}
      <TransitionSound />
      <Audio src={staticFile(SND_WHOOSH)} />

      <FadeUp delay={6}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 700,
            color: COLORS.ink,
            textAlign: "center",
            letterSpacing: -1,
            transform: `scale(${scale})`,
          }}
        >
          Bienvenue dans le Codex
        </div>
      </FadeUp>
      <FadeUp delay={24}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 400,
            color: COLORS.soft,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Hébergement ESMS
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
      {/* Musique de fond, discrète, sur toute la durée (bouclée au besoin) */}
      <Audio src={staticFile(SND_MUSIC)} volume={0.22} loop />

      <Sequence from={0} durationInFrames={90}>
        <SceneAccueil />
      </Sequence>
      <Sequence from={90} durationInFrames={180}>
        <Scene1 />
      </Sequence>
      <Sequence from={270} durationInFrames={270}>
        <Scene2 />
      </Sequence>
      <Sequence from={540} durationInFrames={150}>
        <Scene3 />
      </Sequence>
      <Sequence from={690} durationInFrames={150}>
        <Scene4 />
      </Sequence>
      <Sequence from={840} durationInFrames={90}>
        <Scene5 />
      </Sequence>
    </AbsoluteFill>
  );
};
