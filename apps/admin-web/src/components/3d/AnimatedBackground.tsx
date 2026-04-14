import React, { memo, useMemo } from "react";

/**
 * AnimatedBackground
 *
 * Fixed-position animated background with:
 * - Three large floating gradient orbs (saffron, purple, green) with CSS blur
 * - A subtle dotted grid pattern overlay
 * - 18 floating particle dots that slowly rise via CSS animations
 * - A radial gradient vignette overlay for depth
 *
 * Uses CSS classes from globals.css (.animated-bg, .orb, .orb-*, .particle-field,
 * .particle, @keyframes orbFloat, @keyframes particleFloat) plus inline styles
 * for randomized particle positioning and timing.
 *
 * No external libraries -- pure React 18 + CSS.
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

const PARTICLE_COUNT = 6;

const PARTICLE_COLORS = [
  "rgba(249, 115, 22, 0.12)", // saffron
  "rgba(249, 115, 22, 0.10)",
  "rgba(124, 58, 237, 0.12)", // purple
  "rgba(124, 58, 237, 0.10)",
  "rgba(249, 115, 22, 0.08)",
  "rgba(124, 58, 237, 0.08)",
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
  const particles: Particle[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const left = `${rand() * 100}%`;
    // Start particles spread across the lower portion of the viewport
    const bottom = `${-10 + rand() * 30}%`;
    // 2-4px diameter
    const size = 2 + rand() * 2;
    // 0.15 - 0.35 opacity
    const opacity = 0.15 + rand() * 0.2;
    // 15s - 40s duration
    const duration = `${15 + rand() * 25}s`;
    // Stagger start: 0 - 30s negative delay so they don't all begin at once
    const delay = `${-(rand() * 30)}s`;
    const color = PARTICLE_COLORS[Math.floor(rand() * PARTICLE_COLORS.length)];

    particles.push({ id: i, left, bottom, size, opacity, duration, delay, color });
  }

  return particles;
}

function AnimatedBackgroundImpl(): React.JSX.Element {
  // Memoize particle data so it's computed only once
  const particles = useMemo<Particle[]>(generateParticles, []);

  return (
    <>
      {/* ── Orbs ─────────────────────────────────────── */}
      <div className="animated-bg" aria-hidden="true">
        {/* Saffron orb -- top-right, 500px */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, #FDBA74, transparent 70%)",
            width: 500,
            height: 500,
            top: "-10%",
            right: "-5%",
            opacity: 0.10,
            animationDuration: "20s",
            animationDelay: "0s",
          }}
        />

        {/* Purple orb -- bottom-left, 600px */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, #C4B5FD, transparent 70%)",
            width: 600,
            height: 600,
            bottom: "-15%",
            left: "-10%",
            opacity: 0.12,
            animationDuration: "25s",
            animationDelay: "-7s",
          }}
        />

        {/* Green orb -- centre, 400px, subtler */}
        <div
          className="orb"
          style={{
            background: "radial-gradient(circle, #86EFAC, transparent 70%)",
            width: 400,
            height: 400,
            top: "50%",
            left: "40%",
            opacity: 0.08,
            animationDuration: "18s",
            animationDelay: "-14s",
          }}
        />
      </div>

      {/* ── Grid overlay ─────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
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
            "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.06) 100%)",
        }}
      />
    </>
  );
}

// Background is purely decorative and stateless — memoize so parent
// re-renders (form state, scroll, route transitions) don't re-run
// the particle generator or recreate 18 DOM nodes.
const AnimatedBackground = memo(AnimatedBackgroundImpl);
export default AnimatedBackground;
