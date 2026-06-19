import { useEffect, useRef } from "react";
import { useStore } from "../state/store";
import "./ParticleBurst.css";

const COLORS = ["#5eead4", "#22d3ee", "#a78bfa", "#38bdf8", "#ffffff", "#c4b5fd", "#67e8f9"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  drag: number;
  grav: number;
  streak: boolean;
}

function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * The lock-in climax: a radial burst of glowing particles, a few fast
 * sparkle-streaks, and an expanding shockwave ring, drawn additively on a
 * canvas. Triggers whenever the phase enters "locked".
 */
export function ParticleBurst() {
  const phase = useStore((s) => s.phase);
  const rollNonce = useStore((s) => s.rollNonce);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (phase !== "locked") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.scale(dpr, dpr);

    const cx = w * 0.5;
    const cy = h * 0.47;

    const ps: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 560;
      ps.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0,
        max: 0.7 + Math.random() * 0.9,
        size: 1.5 + Math.random() * 3.2,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        drag: 0.86 + Math.random() * 0.06,
        grav: 260 + Math.random() * 220,
        streak: false,
      });
    }
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 480 + Math.random() * 540;
      ps.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 0.5 + Math.random() * 0.4,
        size: 1 + Math.random() * 1.4,
        color: "#ffffff",
        drag: 0.9,
        grav: 80,
        streak: true,
      });
    }

    const ring = { life: 0, max: 0.62 };
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      let alive = false;

      if (ring.life < ring.max) {
        ring.life += dt;
        const t = ring.life / ring.max;
        const r = 12 + t * Math.min(w, h) * 0.46;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(185,235,255,${(1 - t) * 0.5})`;
        ctx.lineWidth = (1 - t) * 4 + 0.5;
        ctx.stroke();
        alive = true;
      }

      for (const p of ps) {
        if (p.life >= p.max) continue;
        p.life += dt;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.grav * dt;
        const px = p.x;
        const py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const t = p.life / p.max;
        const a = 1 - t;

        if (p.streak) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          const rad = p.size * (1 + (1 - t) * 1.5) * 3;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
          g.addColorStop(0, rgba(p.color, a));
          g.addColorStop(1, rgba(p.color, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        alive = true;
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, rollNonce]);

  return <canvas ref={canvasRef} className="particle-burst" aria-hidden />;
}
