import React, { useMemo } from "react";

/**
 * AnimatedBackground
 *
 * Fixed full-screen animated background with:
 * - Three large gradient orbs (saffron, purple, green) with CSS orbFloat animation
 * - 25 floating particle dots with CSS particleFloat animation, random positions/sizes/delays
 * - A subtle grid pattern overlay (very low opacity)
 * - A radial vignette overlay for depth
 *
 * Performance: will-change: transform on animated elements, GPU-accelerated,
 * pointer-events: none on everything. Pure CSS animations, no JS animation loop.
 */

interface Particle {
  id: number;
  left: string;
  bottom: string;
  size: number;
  opacity: number;
  duration: string;
  delay: string;
  color: string;
}

const PARTICLE_COUNT = 25;

const PARTICLE_COLORS = [
  "rgba(237, 112, 35, 0.14)",   // saffron brand
  "rgba(237, 112, 35, 0.10)",
  "rgba(118, 79, 144, 0.14)",   // purple brand
  "rgba(118, 79, 144, 0.10)",
  "rgba(19, 136, 8, 0.10)",     // green brand
  "rgba(237, 112, 35, 0.08)",
  "rgba(118, 79, 144, 0.08)",
];

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Keeps particle layout stable across renders without depending on Math.random.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateParticles(): Particle[] {
  const rand = mulberry32(42);
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const left = `${rand() * 100}%`;
    const bottom = `${-10 + rand() * 30}%`;
    const size = 2 + rand() * 3;
    const opacity = 0.15 + rand() * 0.25;
    const duration = `${14 + rand() * 28}s`;
    const delay = `${-(rand() * 35)}s`;
    const color = PARTICLE_COLORS[Math.floor(rand() * PARTICLE_COLORS.length)];
    return { id: i, left, bottom, size, opacity, duration, delay, color };
  });
}

export default function AnimatedBackground(): React.JSX.Element {
  const particles = useMemo<Particle[]>(generateParticles, []);

  return (
    <>
      {/* ── Orbs ─────────────────────────────────────── */}
      <div className="animated-bg" aria-hidden="true">
        {/* Saffron orb -- top-right, large */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, rgba(237,112,35,0.35), rgba(253,186,116,0.15), transparent 70%)",
            width: 600,
            height: 600,
            top: "-12%",
            right: "-8%",
            opacity: 0.14,
            animationDuration: "22s",
            animationDelay: "0s",
            willChange: "transform",
          }}
        />

        {/* Purple orb -- bottom-left, largest */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, rgba(118,79,144,0.35), rgba(196,181,253,0.15), transparent 70%)",
            width: 700,
            height: 700,
            bottom: "-18%",
            left: "-12%",
            opacity: 0.13,
            animationDuration: "28s",
            animationDelay: "-8s",
            willChange: "transform",
          }}
        />

        {/* Green orb -- centre-right, medium */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, rgba(19,136,8,0.30), rgba(134,239,172,0.12), transparent 70%)",
            width: 450,
            height: 450,
            top: "45%",
            left: "50%",
            opacity: 0.09,
            animationDuration: "20s",
            animationDelay: "-15s",
            willChange: "transform",
          }}
        />
      </div>

      {/* ── Grid pattern overlay ─────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Particles ────────────────────────────────── */}
      <div className="particle-field" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* ── Radial vignette overlay ──────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)",
        }}
      />
    </>
  );
}
