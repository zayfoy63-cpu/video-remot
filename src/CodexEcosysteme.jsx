import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const C = {
  bg: "#0D1420",
  blue: "#5EA8FF",
  green: "#4ADE9C",
  amber: "#F5B84D",
  white: "#F2F6FC",
  soft: "#8FA3BD",
};

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

const SND_SWOOSH = "mixkit-short-wind-swoosh-1461.wav";
const SND_POP = "mixkit-message-pop-alert-2354.mp3";
const SND_WHOOSH = "mixkit-arrow-whoosh-1491.wav";
const SND_MUSIC = "mixkit-what-about-action-474.mp3";

const TransitionSound = () => <Audio src={staticFile(SND_SWOOSH)} />;

const PopSound = ({ delay }) => (
  <Sequence from={delay} layout="none">
    <Audio src={staticFile(SND_POP)} />
  </Sequence>
);

// Pseudo-aléatoire déterministe (reproductible au rendu).
const rand = (seed) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const lerp = (a, b, t) => a + (b - a) * t;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

/* ------------------------------------------------------------------ */
/* Particules de fond — dérive sinusoïdale + scintillement             */
/* ------------------------------------------------------------------ */

const PARTICLE_COLORS = [C.blue, C.green, C.amber, C.white];

const ParticulesFond = () => {
  const frame = useCurrentFrame();

  // Scène 1 : les particules se rassemblent vers le centre (0 → 1 → 0).
  const gather = interpolate(frame, [8, 42, 62, 95], [0, 0.88, 0.88, 0], clamp);

  const particles = new Array(60).fill(0).map((_, i) => {
    const baseX = rand(i * 3 + 1) * 1920;
    const baseY = rand(i * 3 + 2) * 1080;
    const phase = rand(i * 3 + 3) * Math.PI * 2;
    const speed = 60 + rand(i * 7 + 4) * 80;
    const ampX = 25 + rand(i * 7 + 5) * 45;
    const ampY = 18 + rand(i * 7 + 6) * 35;
    const size = 2.5 + rand(i * 11 + 7) * 3.5;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];

    // Dérive lente.
    const driftX = baseX + Math.sin(frame / speed + phase) * ampX;
    const driftY = baseY + Math.cos(frame / (speed * 1.2) + phase * 1.7) * ampY;

    // Rassemblement vers un anneau serré autour du centre (scène 1).
    const targetX = 960 + Math.cos(phase) * (60 + rand(i + 50) * 130);
    const targetY = 540 + Math.sin(phase) * (35 + rand(i + 60) * 80);
    const x = lerp(driftX, targetX, gather);
    const y = lerp(driftY, targetY, gather);

    // Scintillement d'opacité.
    const twinkle = 0.5 + 0.5 * Math.sin(frame / 13 + phase * 3);
    const opacity = 0.18 + 0.5 * twinkle;

    return { x, y, size, color, opacity, key: i };
  });

  return (
    <AbsoluteFill>
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 4}px ${p.size * 1.5}px ${p.color}55`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 1 — Ouverture : formation du titre "Codex ASE"                */
/* ------------------------------------------------------------------ */

const Scene1 = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({
    frame: frame - 42,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.8 },
  });
  const opacity = interpolate(frame, [42, 60], [0, 1], clamp);

  // Lueur pulsante en boucle douce.
  const pulse = 0.5 + 0.5 * Math.sin(frame / 9);
  const glowSize = 30 + pulse * 45;
  const scale = appear * (1 + 0.025 * pulse);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TransitionSound />
      <PopSound delay={42} />

      <div
        style={{
          fontFamily: FONT,
          fontSize: 150,
          fontWeight: 700,
          color: C.white,
          letterSpacing: 2,
          opacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 ${glowSize}px ${C.blue}, 0 0 ${glowSize * 2.2}px ${C.blue}88`,
        }}
      >
        Codex ASE
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 300,
          color: C.soft,
          marginTop: 24,
          opacity: interpolate(frame, [62, 80], [0, 1], clamp),
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        Hébergement ESMS
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 2 — Le chaos : documents dispersés + caméra simulée           */
/* ------------------------------------------------------------------ */

const DOC_LAYOUT = [
  { x: 380, y: 300, rot: -10, c: C.blue },
  { x: 780, y: 220, rot: 6, c: C.green },
  { x: 1180, y: 320, rot: -5, c: C.amber },
  { x: 480, y: 620, rot: 8, c: C.amber },
  { x: 900, y: 660, rot: -7, c: C.blue },
  { x: 1290, y: 600, rot: 10, c: C.green },
];

// Carte document sombre avec liseré lumineux.
const GlowDoc = ({ color, ghost = 0 }) => (
  <div
    style={{
      width: 190,
      height: 250,
      borderRadius: 14,
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${color}${ghost ? "33" : "77"}`,
      boxShadow: ghost ? "none" : `0 0 32px ${color}33`,
      padding: 20,
      boxSizing: "border-box",
      filter: ghost ? `blur(${ghost * 2.5}px)` : "none",
      opacity: ghost ? 0.28 / ghost : 1,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 9,
        background: `${color}AA`,
        boxShadow: ghost ? "none" : `0 0 18px ${color}88`,
        marginBottom: 16,
      }}
    />
    {[0.95, 0.7, 0.85, 0.55, 0.9].map((w, i) => (
      <div
        key={i}
        style={{
          height: 10,
          borderRadius: 5,
          background: "rgba(255,255,255,0.14)",
          marginBottom: 12,
          width: `${w * 100}%`,
        }}
      />
    ))}
  </div>
);

// Document flottant + 2 copies fantômes décalées (traînée de mouvement).
const ChaosDoc = ({ index, frame, delay }) => {
  const layout = DOC_LAYOUT[index];
  const local = frame - delay;
  const opacity = interpolate(local, [0, 15], [0, 1], clamp);
  const phase = rand(index + 20) * Math.PI * 2;

  // Flottement rapide — la vitesse justifie les traînées.
  const floatX = Math.sin(frame / 14 + phase) * 22;
  const floatY = Math.cos(frame / 11 + phase * 1.4) * 26;
  // Décalage des fantômes : à l'opposé du déplacement (effet traînée).
  const trailX = -Math.cos(frame / 14 + phase) * 14;
  const trailY = Math.sin(frame / 11 + phase * 1.4) * 16;

  return (
    <div style={{ position: "absolute", left: layout.x, top: layout.y, opacity }}>
      {[2, 1].map((g) => (
        <div
          key={g}
          style={{
            position: "absolute",
            left: floatX + trailX * g,
            top: floatY + trailY * g,
            transform: `rotate(${layout.rot}deg)`,
          }}
        >
          <GlowDoc color={layout.c} ghost={g} />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: floatX,
          top: floatY,
          transform: `rotate(${layout.rot}deg)`,
        }}
      >
        <GlowDoc color={layout.c} />
      </div>
    </div>
  );
};

const Scene2 = () => {
  const frame = useCurrentFrame();

  // Mouvement de caméra simulé : zoom lent + rotation de l'ensemble.
  const camScale = interpolate(frame, [0, 160], [1, 1.14], clamp);
  const camRot = interpolate(frame, [0, 160], [0, -2.6], clamp);

  return (
    <AbsoluteFill>
      <TransitionSound />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 600,
          color: C.white,
          opacity: interpolate(frame, [5, 25], [0, 1], clamp),
          textShadow: `0 0 24px ${C.blue}66`,
        }}
      >
        L'information est éparpillée…
      </div>

      <AbsoluteFill
        style={{
          transform: `scale(${camScale}) rotate(${camRot}deg)`,
          transformOrigin: "50% 55%",
        }}
      >
        {DOC_LAYOUT.map((_, i) => (
          <React.Fragment key={i}>
            <PopSound delay={15 + i * 12} />
            <ChaosDoc index={i} frame={frame} delay={15 + i * 12} />
          </React.Fragment>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 3 — Convergence : aspiration + hub lumineux + orbite          */
/* ------------------------------------------------------------------ */

const ORBIT_ITEMS = [
  { icon: "💬", label: "Entretien", color: C.blue },
  { icon: "🔍", label: "Analyse", color: C.green },
  { icon: "📚", label: "Centralisation", color: C.amber },
];

const Scene3 = () => {
  const frame = useCurrentFrame();

  // Aspiration des documents vers le centre, easing accéléré.
  const suck = interpolate(frame, [0, 45], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  // Le hub central grossit et pulse.
  const hubIn = interpolate(frame, [30, 65], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.4)),
  });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 8);
  const hubGlow = 40 + pulse * 55;

  // Orbite : rotation continue lente.
  const orbitAngle = frame * 0.55;
  const orbitR = 330;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TransitionSound />
      <Sequence from={38} layout="none">
        <Audio src={staticFile(SND_WHOOSH)} />
      </Sequence>

      {/* Documents aspirés vers le centre */}
      {suck < 1 &&
        DOC_LAYOUT.map((l, i) => {
          const x = lerp(l.x, 960 - 95, suck);
          const y = lerp(l.y, 540 - 125, suck);
          const s = lerp(1, 0.05, suck);
          const o = interpolate(suck, [0, 0.85, 1], [1, 0.8, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `rotate(${l.rot + suck * 160}deg) scale(${s})`,
                opacity: o,
              }}
            >
              <GlowDoc color={l.c} />
            </div>
          );
        })}

      {/* Hub central lumineux */}
      <div
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.white} 0%, ${C.blue} 45%, transparent 72%)`,
          transform: `scale(${hubIn * (1 + 0.06 * pulse)})`,
          boxShadow: `0 0 ${hubGlow}px ${hubGlow / 2}px ${C.blue}66`,
          opacity: hubIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          marginTop: 0,
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 700,
          color: C.bg,
          opacity: hubIn,
          transform: `scale(${hubIn})`,
          zIndex: 2,
        }}
      >
        Codex
      </div>

      {/* 3 éléments en orbite */}
      {ORBIT_ITEMS.map((it, i) => {
        const appear = interpolate(frame, [70 + i * 18, 92 + i * 18], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        const a = ((orbitAngle + i * 120) * Math.PI) / 180;
        const x = Math.cos(a) * orbitR * appear;
        const y = Math.sin(a) * orbitR * 0.62 * appear;
        return (
          <React.Fragment key={it.label}>
            <PopSound delay={70 + i * 18} />
            <div
              style={{
                position: "absolute",
                transform: `translate(${x}px, ${y}px) scale(${appear})`,
                opacity: appear,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: `2px solid ${it.color}`,
                  boxShadow: `0 0 34px 8px ${it.color}55, inset 0 0 22px ${it.color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 60,
                }}
              >
                {it.icon}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 600,
                  color: C.white,
                  marginTop: 14,
                  textShadow: `0 0 16px ${it.color}AA`,
                }}
              >
                {it.label}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 4 — Éclatement réseau : constellation de mini-hubs            */
/* ------------------------------------------------------------------ */

const NODES = [
  { x: 960, y: 470, r: 62, c: C.blue, main: true },
  { x: 520, y: 300, r: 42, c: C.green },
  { x: 1400, y: 280, r: 46, c: C.amber },
  { x: 340, y: 660, r: 38, c: C.amber },
  { x: 1520, y: 640, r: 40, c: C.green },
  { x: 760, y: 800, r: 44, c: C.blue },
  { x: 1180, y: 820, r: 36, c: C.green },
];

const LINKS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [2, 4],
];

const Scene4 = () => {
  const frame = useCurrentFrame();

  // Les nœuds partent du centre et s'écartent vers leur position.
  const spread = interpolate(frame, [10, 55], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const nodePos = NODES.map((n) => ({
    ...n,
    px: lerp(960, n.x, n.main ? 1 : spread),
    py: lerp(470, n.y, n.main ? 1 : spread),
  }));

  return (
    <AbsoluteFill>
      <TransitionSound />
      <PopSound delay={12} />
      <PopSound delay={30} />

      <div
        style={{
          position: "absolute",
          top: 85,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 600,
          color: C.white,
          opacity: interpolate(frame, [5, 25], [0, 1], clamp),
          textShadow: `0 0 24px ${C.green}66`,
        }}
      >
        Un Codex par secteur
      </div>

      {/* Lignes lumineuses animées */}
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        {LINKS.map(([a, b], i) => {
          const na = nodePos[a];
          const nb = nodePos[b];
          const lineIn = interpolate(frame, [40 + i * 6, 62 + i * 6], [0, 1], clamp);
          const shimmer = 0.45 + 0.35 * Math.sin(frame / 10 + i * 1.3);
          const x2 = lerp(na.px, nb.px, lineIn);
          const y2 = lerp(na.py, nb.py, lineIn);
          return (
            <line
              key={i}
              x1={na.px}
              y1={na.py}
              x2={x2}
              y2={y2}
              stroke={nb.c}
              strokeWidth={2}
              opacity={lineIn * shimmer}
              style={{ filter: `drop-shadow(0 0 6px ${nb.c})` }}
            />
          );
        })}
      </svg>

      {/* Nœuds */}
      {nodePos.map((n, i) => {
        const appear = n.main
          ? 1
          : interpolate(spread, [0.15, 0.85], [0, 1], clamp);
        const pulse = 0.5 + 0.5 * Math.sin(frame / 9 + i * 1.1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.px - n.r,
              top: n.py - n.r,
              width: n.r * 2,
              height: n.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.white}EE 0%, ${n.c} 55%, transparent 78%)`,
              boxShadow: `0 0 ${22 + pulse * 26}px ${8 + pulse * 8}px ${n.c}55`,
              opacity: appear,
              transform: `scale(${appear})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontSize: n.main ? 26 : 19,
              fontWeight: 700,
              color: C.bg,
            }}
          >
            {n.main ? "ASE" : "📚"}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 5 — Bénéfices en parallaxe                                    */
/* ------------------------------------------------------------------ */

const BENEFITS = [
  { icon: "💡", label: "Clarté", color: C.blue, depth: 1.6 },
  { icon: "🎯", label: "Autonomie", color: C.green, depth: 1.0 },
  { icon: "⏱️", label: "Gain de temps", color: C.amber, depth: 0.55 },
];

const Scene5 = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <TransitionSound />

      <div
        style={{
          position: "absolute",
          top: 85,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 600,
          color: C.white,
          opacity: interpolate(frame, [5, 25], [0, 1], clamp),
          textShadow: `0 0 24px ${C.amber}66`,
        }}
      >
        Des bénéfices concrets
      </div>

      <div style={{ display: "flex", gap: 90 }}>
        {BENEFITS.map((b, i) => {
          const appear = interpolate(frame, [18 + i * 16, 42 + i * 16], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          });
          // Parallaxe : dérive horizontale liée au frame, amplitude ∝ profondeur.
          const drift = Math.sin(frame / 55 + i * 1.8) * 26 * b.depth;
          const ty = lerp(60, 0, appear);
          const pulse = 0.5 + 0.5 * Math.sin(frame / 11 + i * 2.2);
          return (
            <React.Fragment key={b.label}>
              <PopSound delay={18 + i * 16} />
              <div
                style={{
                  width: 380,
                  height: 430,
                  borderRadius: 26,
                  background: "rgba(255,255,255,0.055)",
                  border: `1px solid ${b.color}66`,
                  boxShadow: `0 0 ${36 + pulse * 22}px ${b.color}44, inset 0 0 30px ${b.color}22`,
                  opacity: appear,
                  transform: `translate(${drift}px, ${ty}px) scale(${0.9 + appear * 0.1})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 105,
                    marginBottom: 30,
                    filter: `drop-shadow(0 0 22px ${b.color})`,
                  }}
                >
                  {b.icon}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 44,
                    fontWeight: 700,
                    color: C.white,
                    textShadow: `0 0 20px ${b.color}AA`,
                  }}
                >
                  {b.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scène 6 — Conclusion : explosion de lumière + texte final           */
/* ------------------------------------------------------------------ */

const Scene6 = () => {
  const frame = useCurrentFrame();

  // Halo qui converge puis explose doucement en lumière.
  const gatherIn = interpolate(frame, [0, 22], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const burst = interpolate(frame, [22, 60], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const burstScale = lerp(0.4, 8, burst);
  const burstOpacity = gatherIn * interpolate(burst, [0, 0.25, 1], [1, 0.75, 0], clamp);
  const burstBlur = lerp(2, 42, burst);

  const textIn = interpolate(frame, [45, 70], [0, 1], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 10);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <TransitionSound />
      <Sequence from={18} layout="none">
        <Audio src={staticFile(SND_WHOOSH)} />
      </Sequence>

      {/* Explosion de lumière */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.white} 0%, ${C.blue}CC 40%, transparent 70%)`,
          transform: `scale(${burstScale * gatherIn})`,
          opacity: burstOpacity,
          filter: `blur(${burstBlur}px)`,
        }}
      />

      <div
        style={{
          fontFamily: FONT,
          fontSize: 82,
          fontWeight: 700,
          color: C.white,
          textAlign: "center",
          lineHeight: 1.3,
          opacity: textIn,
          transform: `translateY(${lerp(35, 0, textIn)}px)`,
          textShadow: `0 0 ${24 + pulse * 26}px ${C.blue}`,
        }}
      >
        Toute l'information,
        <br />
        <span style={{ color: C.blue, textShadow: `0 0 ${28 + pulse * 30}px ${C.blue}` }}>
          au même endroit.
        </span>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: 300,
          color: C.soft,
          marginTop: 44,
          opacity: interpolate(frame, [72, 92], [0, 1], clamp),
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Codex ASE — Hébergement ESMS
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const CodexEcosysteme = () => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Musique de fond discrète, bouclée */}
      <Audio src={staticFile(SND_MUSIC)} volume={0.2} loop />

      {/* Particules permanentes, sous les scènes */}
      <ParticulesFond />

      <Sequence from={0} durationInFrames={100}>
        <Scene1 />
      </Sequence>
      <Sequence from={100} durationInFrames={160}>
        <Scene2 />
      </Sequence>
      <Sequence from={260} durationInFrames={200}>
        <Scene3 />
      </Sequence>
      <Sequence from={460} durationInFrames={160}>
        <Scene4 />
      </Sequence>
      <Sequence from={620} durationInFrames={160}>
        <Scene5 />
      </Sequence>
      <Sequence from={780} durationInFrames={120}>
        <Scene6 />
      </Sequence>
    </AbsoluteFill>
  );
};
