import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  interpolate,
  interpolateColors,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ------------------------------------------------------------------ */
/* Palette "Racines & Lumière"                                         */
/* ------------------------------------------------------------------ */

const C = {
  ambre: "#F5B84D",
  terracotta: "#E08A5B",
  sauge: "#8FCB9B",
  creme: "#FDF6EC",
  silhouette: "#3A2716",
};

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

const SND_SWOOSH = "mixkit-short-wind-swoosh-1461.wav";
const SND_POP = "mixkit-message-pop-alert-2354.mp3";
const SND_WHOOSH = "mixkit-arrow-whoosh-1491.wav";
const SND_MUSIC = "mixkit-what-about-action-474.mp3";
const SND_CLICK = "mixkit-fast-double-click-on-mouse-275.wav";

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

const Snd = ({ src, from, volume = 1 }) => (
  <Sequence from={from} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

/* ------------------------------------------------------------------ */
/* Géométrie de l'arbre                                                */
/* ------------------------------------------------------------------ */

// Point d'origine : là où les graines convergent et où tout pousse.
const ORIGINE = { x: 960, y: 872 };

// Racines : éventail de courbes quadratiques vers le bas, 2 vagues.
const RACINES = (() => {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const a = (lerp(18, 162, t) * Math.PI) / 180;
    const len = 200 + rand(i * 5 + 2) * 230;
    const ex = ORIGINE.x + Math.cos(a) * len * 1.45;
    const ey = Math.min(1058, ORIGINE.y + Math.sin(a) * len * 0.55 + 26);
    const cx = ORIGINE.x + Math.cos(a) * len * 0.55 + (rand(i * 7 + 3) - 0.5) * 130;
    const cy = ORIGINE.y + 22 + rand(i * 7 + 4) * 55;
    out.push({
      d: `M ${ORIGINE.x} ${ORIGINE.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      delay: 132 + rand(i * 3 + 9) * 55,
      dur: 55 + rand(i * 3 + 10) * 25,
      width: 3 + rand(i * 3 + 11) * 3,
      color: i % 4 === 1 ? C.terracotta : i % 4 === 3 ? C.sauge : C.ambre,
    });
  }
  // Radicelles plus fines, deuxième vague.
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const a = (lerp(32, 148, t) * Math.PI) / 180;
    const len = 90 + rand(i * 9 + 30) * 130;
    const ex = ORIGINE.x + Math.cos(a) * len * 1.5;
    const ey = Math.min(1050, ORIGINE.y + Math.sin(a) * len * 0.6 + 18);
    const cx = ORIGINE.x + Math.cos(a) * len * 0.5 + (rand(i * 9 + 31) - 0.5) * 90;
    const cy = ORIGINE.y + 15 + rand(i * 9 + 32) * 40;
    out.push({
      d: `M ${ORIGINE.x} ${ORIGINE.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      delay: 168 + rand(i * 9 + 33) * 50,
      dur: 45 + rand(i * 9 + 34) * 20,
      width: 1.5 + rand(i * 9 + 35) * 1.8,
      color: i % 3 === 2 ? C.terracotta : C.ambre,
    });
  }
  return out;
})();

const TIGE = {
  d: "M 960 874 C 946 760 974 640 958 540 C 950 492 962 466 960 438",
  start: 262,
  dur: 68,
};

const JONCTION = { x: 960, y: 440 };

const BRANCHES = [
  {
    id: "entretien",
    d: "M 960 440 C 868 424 726 402 612 352 C 596 345 585 338 577 331",
    tip: { x: 577, y: 331 },
    icon: "💬",
    label: "Entretien",
    color: C.ambre,
    start: 330,
    pop: 372,
  },
  {
    id: "analyse",
    d: "M 960 440 C 964 372 948 300 957 232",
    tip: { x: 957, y: 226 },
    icon: "🔍",
    label: "Analyse",
    color: C.sauge,
    start: 348,
    pop: 392,
  },
  {
    id: "centralisation",
    d: "M 960 440 C 1052 424 1194 402 1308 352 C 1324 345 1335 338 1343 331",
    tip: { x: 1343, y: 331 },
    icon: "📚",
    label: "Centralisation",
    color: C.terracotta,
    start: 366,
    pop: 412,
  },
];

// Temps forts scène 4 — zoom sur Entretien.
const FOCUS_IN = 460;
const FOCUS_HOLD = 486;
const FOCUS_OUT = 534;
const FOCUS_END = 560;

const FEUILLES = [
  { texte: "Bilan des problèmes rencontrés", delay: 495 },
  { texte: "Documents et outils utilisés", delay: 511 },
  { texte: "Qui sont les usagers du Codex", delay: 527 },
];

// Forêt de la scène 5 — un mini-arbre par secteur, avec profondeur.
const FORET = (() => {
  const defs = [
    { x: 250, base: 942, h: 300, depth: 0.55, color: C.sauge, delay: 580 },
    { x: 480, base: 958, h: 380, depth: 0.85, color: C.terracotta, delay: 598 },
    { x: 1400, base: 952, h: 360, depth: 0.95, color: C.sauge, delay: 616 },
    { x: 1680, base: 938, h: 290, depth: 1.35, color: C.terracotta, delay: 634 },
    { x: 118, base: 966, h: 210, depth: 1.6, color: C.ambre, delay: 648 },
    { x: 1810, base: 968, h: 235, depth: 0.45, color: C.ambre, delay: 652 },
  ];
  return defs.map((tr, i) => {
    const sway = rand(i * 13 + 40) > 0.5 ? 1 : -1;
    const cx = tr.x + sway * 30;
    const cy = tr.base - tr.h * 0.5;
    const ex = tr.x + sway * 12;
    const ey = tr.base - tr.h;
    // Point d'ancrage des branches sur la tige (t = 0.6 de la quadratique).
    const t = 0.6;
    const ax = (1 - t) * (1 - t) * tr.x + 2 * (1 - t) * t * cx + t * t * ex;
    const ay = (1 - t) * (1 - t) * tr.base + 2 * (1 - t) * t * cy + t * t * ey;
    const spread = tr.h * 0.42;
    return {
      ...tr,
      stem: `M ${tr.x} ${tr.base} Q ${cx} ${cy} ${ex} ${ey}`,
      tip: { x: ex, y: ey },
      branches: [
        {
          d: `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${ax - spread * 0.6} ${ay - spread * 0.5} ${ax - spread} ${ay - spread * 0.55}`,
          tip: { x: ax - spread, y: ay - spread * 0.55 },
        },
        {
          d: `M ${ax.toFixed(1)} ${(ay + 26).toFixed(1)} Q ${ax + spread * 0.6} ${ay - spread * 0.35} ${ax + spread * 0.92} ${ay - spread * 0.42}`,
          tip: { x: ax + spread * 0.92, y: ay - spread * 0.42 },
        },
      ],
    };
  });
})();

/* ------------------------------------------------------------------ */
/* Graines — lucioles qui dérivent puis convergent vers l'origine      */
/* ------------------------------------------------------------------ */

const Graines = ({ frame }) => {
  const gather = interpolate(frame, [100, 158], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const fade = interpolate(frame, [146, 188], [1, 0], clamp);
  if (fade <= 0) return null;

  const seeds = new Array(40).fill(0).map((_, i) => {
    const baseX = 50 + rand(i * 4 + 1) * 1820;
    const baseY = 60 + rand(i * 4 + 2) * 760;
    const phase = rand(i * 4 + 3) * Math.PI * 2;
    const speed = 55 + rand(i * 6 + 4) * 75;
    const size = 3 + rand(i * 6 + 5) * 4;
    const dx = Math.sin(frame / speed + phase) * (30 + rand(i + 70) * 50);
    const dy = Math.cos(frame / (speed * 1.15) + phase * 1.6) * (22 + rand(i + 80) * 40);
    const tx = ORIGINE.x + (rand(i * 4 + 6) - 0.5) * 130;
    const ty = ORIGINE.y - 8 + (rand(i * 4 + 7) - 0.5) * 34;
    const x = lerp(baseX + dx, tx, gather);
    const y = lerp(baseY + dy, ty, gather);
    const twinkle = 0.5 + 0.5 * Math.sin(frame / 11 + phase * 3);
    const color = rand(i + 90) > 0.82 ? C.sauge : C.ambre;
    return {
      x,
      y,
      size: size * (1 - 0.35 * gather),
      color,
      opacity: (0.25 + 0.6 * twinkle) * fade,
      key: i,
    };
  });

  return (
    <AbsoluteFill>
      {seeds.map((p) => (
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
            boxShadow: `0 0 ${p.size * 4}px ${p.size * 1.6}px ${p.color}55`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Quelques lucioles ambiantes qui persistent après l'enracinement.
const Lucioles = ({ frame }) => {
  const fadeIn = interpolate(frame, [210, 265], [0, 1], clamp);
  if (fadeIn <= 0) return null;

  const flies = new Array(14).fill(0).map((_, i) => {
    const baseX = 80 + rand(i * 8 + 201) * 1760;
    const baseY = 120 + rand(i * 8 + 202) * 640;
    const phase = rand(i * 8 + 203) * Math.PI * 2;
    const x = baseX + Math.sin(frame / 90 + phase) * 60;
    const y = baseY + Math.cos(frame / 70 + phase * 1.3) * 40 - frame * 0.02 * (0.5 + rand(i + 204));
    const twinkle = 0.5 + 0.5 * Math.sin(frame / 14 + phase * 2.4);
    const size = 2.5 + rand(i * 8 + 205) * 2.5;
    return {
      x,
      y,
      size,
      opacity: (0.08 + 0.2 * twinkle) * fadeIn,
      color: rand(i + 206) > 0.75 ? C.sauge : C.ambre,
      key: i,
    };
  });

  return (
    <AbsoluteFill>
      {flies.map((p) => (
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
            boxShadow: `0 0 ${p.size * 4}px ${p.size}px ${p.color}44`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Arbre principal — traits SVG animés par strokeDashoffset            */
/* ------------------------------------------------------------------ */

// Trait qui "pousse" : pathLength normalisé à 100, dashoffset décroissant.
const TraitCroissant = ({ d, progress, color, width, glow }) => {
  if (progress <= 0.002) return null;
  return (
    <path
      d={d}
      pathLength={100}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={100}
      strokeDashoffset={Math.max(0, 100 * (1 - progress))}
      style={glow > 0.05 ? { filter: `drop-shadow(0 0 ${glow}px ${color})` } : undefined}
    />
  );
};

const ArbreSVG = ({ frame, focus, sil }) => {
  // En scène 6 les traits glissent vers une silhouette brun sombre.
  const colSil = (c) => (sil <= 0 ? c : interpolateColors(sil, [0, 1], [c, C.silhouette]));
  const glowPx = 7 * (1 - 0.7 * sil);

  const tigeP = interpolate(frame, [TIGE.start, TIGE.start + TIGE.dur], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <svg
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="tigeGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={colSil(C.ambre)} />
          <stop offset="100%" stopColor={colSil(C.sauge)} />
        </linearGradient>
      </defs>

      {/* Racines — s'estompent légèrement pendant le zoom Entretien */}
      <g style={{ opacity: 1 - 0.35 * focus }}>
        {RACINES.map((r, i) => {
          const p = interpolate(frame, [r.delay, r.delay + r.dur], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          });
          return (
            <TraitCroissant
              key={i}
              d={r.d}
              progress={p}
              color={colSil(r.color)}
              width={r.width}
              glow={glowPx * 0.8}
            />
          );
        })}
      </g>

      {/* Tige */}
      <g style={{ opacity: 1 - 0.3 * focus }}>
        <TraitCroissant
          d={TIGE.d}
          progress={tigeP}
          color="url(#tigeGrad)"
          width={8}
          glow={glowPx}
        />
      </g>

      {/* Branches — easing "back" pour une pousse organique */}
      {BRANCHES.map((b) => {
        const p = interpolate(frame, [b.start, b.start + 56], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.back(1.15)),
        });
        const estFocus = b.id === "entretien";
        const dim = estFocus ? 0 : focus;
        return (
          <g
            key={b.id}
            style={{
              opacity: 1 - 0.6 * dim,
              filter: dim > 0.01 ? `blur(${4 * dim}px)` : undefined,
            }}
          >
            <TraitCroissant
              d={b.d}
              progress={Math.min(1, p)}
              color={colSil(b.color)}
              width={5.5}
              glow={glowPx * (estFocus ? 1 + focus : 1)}
            />
          </g>
        );
      })}

      {/* Lanternes de la scène 6 : petits points chauds aux extrémités */}
      {sil > 0.01 &&
        BRANCHES.map((b, i) => {
          const pulse = 0.5 + 0.5 * Math.sin(frame / 12 + i * 2.1);
          return (
            <circle
              key={b.id}
              cx={b.tip.x}
              cy={b.tip.y}
              r={5 + pulse * 2.5}
              fill={C.ambre}
              opacity={sil * (0.6 + 0.4 * pulse)}
              style={{ filter: `drop-shadow(0 0 ${10 + pulse * 8}px ${C.ambre})` }}
            />
          );
        })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Bourgeons — Entretien / Analyse / Centralisation                    */
/* ------------------------------------------------------------------ */

const Bourgeons = ({ frame, fps, focus, sil }) => {
  const fadeSil = 1 - interpolate(frame, [720, 758], [0, 1], clamp);
  if (fadeSil <= 0) return null;

  return (
    <>
      {BRANCHES.map((b, i) => {
        const appear = spring({
          frame: frame - b.pop + 4,
          fps,
          config: { damping: 9, stiffness: 110, mass: 0.7 },
        });
        if (frame < b.pop - 4) return null;
        const estFocus = b.id === "entretien";
        const dim = estFocus ? 0 : focus;
        const pulse = 0.5 + 0.5 * Math.sin(frame / 10 + i * 1.7);
        const scale = appear * (1 + 0.04 * pulse) * (estFocus ? 1 + 0.18 * focus : 1);
        const glow = (26 + pulse * 18) * (estFocus ? 1 + 1.2 * focus : 1) * (1 - 0.6 * sil);
        return (
          <div
            key={b.id}
            style={{
              position: "absolute",
              left: b.tip.x - 48,
              top: b.tip.y - 48,
              opacity: fadeSil * (1 - 0.65 * dim),
              filter: dim > 0.01 ? `blur(${4 * dim}px)` : undefined,
              zIndex: estFocus ? 4 : 3,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${C.creme}22 0%, ${b.color}33 55%, transparent 75%)`,
                border: `2px solid ${b.color}`,
                boxShadow: `0 0 ${glow}px ${b.color}66, inset 0 0 20px ${b.color}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                transform: `scale(${scale})`,
              }}
            >
              {b.icon}
            </div>
            <div
              style={{
                position: "absolute",
                left: -82,
                top: 104,
                width: 260,
                textAlign: "center",
                fontFamily: FONT,
                fontSize: 27,
                fontWeight: 600,
                color: C.creme,
                opacity: Math.min(1, appear),
                textShadow: `0 0 16px ${b.color}, 0 0 34px ${b.color}66`,
              }}
            >
              {b.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Feuilles de la scène 4 — poussent en cascade près d'Entretien       */
/* ------------------------------------------------------------------ */

const FeuillesEntretien = ({ frame, fps, focus }) => {
  if (frame < FOCUS_HOLD - 6 || focus <= 0.01) return null;

  return (
    <>
      {FEUILLES.map((f, i) => {
        const appear = spring({
          frame: frame - f.delay,
          fps,
          config: { damping: 11, stiffness: 130, mass: 0.6 },
        });
        if (frame < f.delay) return null;
        const y = 402 + i * 56;
        return (
          <div
            key={f.texte}
            style={{
              position: "absolute",
              left: 690,
              top: y,
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: Math.min(1, appear) * focus,
              transform: `translateY(${lerp(14, 0, Math.min(1, appear))}px)`,
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                background: `linear-gradient(135deg, ${C.sauge}, ${C.sauge}88)`,
                borderRadius: "0 60% 0 60%",
                transform: `rotate(${-15 + i * 10}deg) scale(${appear})`,
                boxShadow: `0 0 14px ${C.sauge}AA`,
              }}
            />
            <div
              style={{
                fontFamily: FONT,
                fontSize: 23,
                fontWeight: 500,
                color: C.creme,
                textShadow: `0 0 12px ${C.sauge}88, 0 0 26px ${C.ambre}44`,
                whiteSpace: "nowrap",
              }}
            >
              {f.texte}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Forêt — scène 5, ramifications parallèles avec parallaxe            */
/* ------------------------------------------------------------------ */

const Foret = ({ frame, fps, pan, sil }) => {
  if (frame < 574) return null;
  const colSil = (c) => (sil <= 0 ? c : interpolateColors(sil, [0, 1], [c, C.silhouette]));

  return (
    <>
      {FORET.map((tr, i) => {
        const p = interpolate(frame, [tr.delay, tr.delay + 52], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        if (p <= 0) return null;
        const pBranches = interpolate(frame, [tr.delay + 26, tr.delay + 70], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.back(1.2)),
        });
        const tipIn = spring({
          frame: frame - tr.delay - 44,
          fps,
          config: { damping: 10, stiffness: 120, mass: 0.6 },
        });
        // Parallaxe : les couches lointaines dérivent moins que les proches.
        const tx = (1 - tr.depth) * pan;
        const flou = tr.depth < 0.6 ? 2 : tr.depth > 1.3 ? 1.2 : 0;
        const alpha = tr.depth < 0.6 ? 0.55 : tr.depth > 1.3 ? 0.8 : 0.95;
        const w = 3 + tr.depth * 1.6;
        const pulse = 0.5 + 0.5 * Math.sin(frame / 13 + i * 1.9);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateX(${tx}px)`,
              opacity: alpha,
              filter: flou ? `blur(${flou}px)` : undefined,
            }}
          >
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
              <TraitCroissant
                d={tr.stem}
                progress={p}
                color={colSil(tr.color)}
                width={w}
                glow={5 * (1 - 0.7 * sil)}
              />
              {tr.branches.map((br, j) => (
                <TraitCroissant
                  key={j}
                  d={br.d}
                  progress={Math.min(1, pBranches)}
                  color={colSil(tr.color)}
                  width={w * 0.65}
                  glow={4 * (1 - 0.7 * sil)}
                />
              ))}
              {frame > tr.delay + 44 &&
                [tr.tip, ...tr.branches.map((br) => br.tip)].map((tp, j) => (
                  <circle
                    key={j}
                    cx={tp.x}
                    cy={tp.y}
                    r={(4 + pulse * 2) * Math.min(1, tipIn)}
                    fill={C.ambre}
                    opacity={Math.min(1, tipIn) * (0.5 + 0.4 * pulse)}
                    style={{ filter: `drop-shadow(0 0 8px ${C.ambre})` }}
                  />
                ))}
            </svg>
          </div>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Textes des scènes                                                   */
/* ------------------------------------------------------------------ */

const TexteScene1 = ({ frame }) => {
  const opacity =
    interpolate(frame, [22, 48], [0, 1], clamp) *
    interpolate(frame, [86, 100], [1, 0], clamp);
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 300,
          letterSpacing: 3,
          color: C.creme,
          opacity: opacity * 0.9,
          textShadow: `0 0 18px ${C.ambre}66`,
        }}
      >
        L'information, éparpillée.
      </div>
    </AbsoluteFill>
  );
};

const TexteScene5 = ({ frame }) => {
  const opacity =
    interpolate(frame, [648, 672], [0, 1], clamp) *
    interpolate(frame, [712, 728], [1, 0], clamp);
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 104,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 52,
        fontWeight: 600,
        color: C.creme,
        opacity,
        textShadow: `0 0 22px ${C.sauge}88, 0 0 44px ${C.sauge}44`,
      }}
    >
      Chaque secteur a son Codex
    </div>
  );
};

const TexteFinal = ({ frame }) => {
  const inMain = interpolate(frame, [768, 798], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  if (inMain <= 0) return null;
  const inSub = interpolate(frame, [812, 836], [0, 1], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 10);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        paddingBottom: 90,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 78,
          fontWeight: 700,
          color: C.creme,
          textAlign: "center",
          lineHeight: 1.3,
          opacity: inMain,
          transform: `translateY(${lerp(30, 0, inMain)}px)`,
          textShadow: `0 0 ${26 + pulse * 22}px ${C.ambre}, 0 3px 26px rgba(26, 20, 16, 0.85)`,
        }}
      >
        Toute l'information,
        <br />
        au même endroit.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 29,
          fontWeight: 300,
          color: C.creme,
          marginTop: 42,
          opacity: inSub * 0.92,
          letterSpacing: 5,
          textTransform: "uppercase",
          textShadow: `0 0 14px ${C.terracotta}, 0 2px 16px rgba(26, 20, 16, 0.8)`,
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

export const CodexArbre = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ciel : s'éclaircit imperceptiblement, puis lever du jour en scène 6.
  const bgHaut = interpolateColors(frame, [0, 690, 862], ["#1A1410", "#221A11", "#4A3520"]);
  const bgBas = interpolateColors(frame, [0, 690, 862], ["#2E1F14", "#3A2917", "#E9BE7E"]);
  const aube = interpolate(frame, [700, 850], [0, 1], clamp);

  // Silhouette (scène 6) : l'arbre s'assombrit en contre-jour.
  const sil = interpolate(frame, [725, 805], [0, 1], clamp);

  // Caméra — zoom Entretien (scène 4) puis dézoom Floraison (scène 5).
  const focus = interpolate(frame, [FOCUS_IN, FOCUS_HOLD, FOCUS_OUT, FOCUS_END], [0, 1, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const dezoom = interpolate(frame, [560, 640], [1, 0.8], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const zoomFin = interpolate(frame, [720, 880], [1, 1.05], clamp);
  const pan = interpolate(frame, [560, 880], [0, 46], clamp);

  const cible = BRANCHES[0].tip; // bourgeon Entretien
  let camTransform;
  let camOrigin;
  if (frame < 560) {
    const s = 1 + 0.9 * focus;
    camTransform = `translate(${(960 - cible.x) * focus}px, ${(480 - cible.y) * focus}px) scale(${s})`;
    camOrigin = `${cible.x}px ${cible.y}px`;
  } else {
    camTransform = `scale(${dezoom * zoomFin})`;
    camOrigin = "960px 620px";
  }

  // Cœur lumineux à l'origine (la graine plantée).
  const coeurIn = interpolate(frame, [118, 142], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 9);

  // Halo lanterne de la scène 6.
  const halo = sil * (0.45 + 0.25 * pulse);

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${bgHaut} 0%, ${bgBas} 100%)` }}
    >
      {/* ------ Bande son ------ */}
      <Audio src={staticFile(SND_MUSIC)} volume={0.2} loop />
      <Snd src={SND_SWOOSH} from={2} volume={0.8} />
      <Snd src={SND_SWOOSH} from={100} />
      <Snd src={SND_WHOOSH} from={118} />
      <Snd src={SND_SWOOSH} from={260} />
      <Snd src={SND_WHOOSH} from={262} />
      <Snd src={SND_SWOOSH} from={FOCUS_IN} />
      <Snd src={SND_CLICK} from={FOCUS_IN} />
      <Snd src={SND_SWOOSH} from={560} />
      <Snd src={SND_SWOOSH} from={720} />
      {[372, 392, 412, 495, 511, 527, 580, 598, 616, 634, 772].map((f) => (
        <Snd key={f} src={SND_POP} from={f} volume={0.85} />
      ))}

      {/* Lueur d'horizon — le jour se lève derrière la forêt */}
      <div
        style={{
          position: "absolute",
          left: 960 - 900,
          top: 1080 - 480,
          width: 1800,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFE9C4AA 0%, ${C.ambre}44 40%, transparent 70%)`,
          opacity: aube * 0.75,
          filter: "blur(30px)",
        }}
      />

      {/* ------ Monde de l'arbre (sous caméra) ------ */}
      <AbsoluteFill style={{ transform: camTransform, transformOrigin: camOrigin }}>
        {/* Halo lanterne derrière l'arbre (scène 6) */}
        {halo > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: 960 - 400,
              top: 420 - 400,
              width: 800,
              height: 800,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.ambre}66 0%, ${C.terracotta}33 45%, transparent 70%)`,
              opacity: halo,
              transform: `scale(${1 + 0.06 * pulse})`,
              filter: "blur(24px)",
            }}
          />
        )}

        {/* Lueur du sol */}
        <div
          style={{
            position: "absolute",
            left: 960 - 800,
            top: ORIGINE.y - 90,
            width: 1600,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${C.ambre}33 0%, transparent 65%)`,
            opacity: interpolate(frame, [150, 230], [0, 0.55], clamp),
            filter: "blur(18px)",
          }}
        />

        <Foret frame={frame} fps={fps} pan={pan} sil={sil} />

        {/* Cœur de la graine plantée */}
        {coeurIn > 0 && (
          <div
            style={{
              position: "absolute",
              left: ORIGINE.x - 13,
              top: ORIGINE.y - 13,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.creme} 0%, ${C.ambre} 55%, transparent 78%)`,
              transform: `scale(${coeurIn * (1 + 0.12 * pulse)})`,
              opacity: coeurIn * (1 - 0.5 * sil),
              boxShadow: `0 0 ${22 + pulse * 20}px ${8 + pulse * 6}px ${C.ambre}55`,
            }}
          />
        )}

        <ArbreSVG frame={frame} focus={focus} sil={sil} />
        <Bourgeons frame={frame} fps={fps} focus={focus} sil={sil} />
        <FeuillesEntretien frame={frame} fps={fps} focus={focus} />
      </AbsoluteFill>

      {/* ------ Couches écran ------ */}
      <Graines frame={frame} />
      <Lucioles frame={frame} />
      <TexteScene1 frame={frame} />
      <TexteScene5 frame={frame} />
      <TexteFinal frame={frame} />
    </AbsoluteFill>
  );
};
