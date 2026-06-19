import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from "motion/react";
import { useStore } from "../state/store";
import {
  buildReelPlan,
  centeredIndexAtY,
  DEFAULT_SLOT_H,
  OVERSHOOT,
  REEL_WINDOW_SLOTS,
  yForSlot,
  type ReelItem,
  type ReelPlan,
} from "../lib/reel";
import { sound } from "../lib/sound";
import { ParticleBurst } from "./ParticleBurst";
import "./NameReel.css";

/**
 * ★ The north-star interaction.
 *
 * A single MotionValue `y` drives a tall strip of names. One roll is three
 * physically-continuous beats on that value:
 *
 *   1. wind-up   — a tiny pull-back for anticipation
 *   2. fly+decel — a fast launch easing hard into a near-stop, overshooting
 *                  a hair PAST center (real motion blur derived from velocity)
 *   3. rebound   — an under-damped spring snaps the winner back onto center
 *
 * Lock-in then fires the chime + particle burst and the winner blooms.
 *
 * The slot height is responsive, so we measure it live (window height /
 * REEL_WINDOW_SLOTS) and thread it through the centering math.
 */
export function NameReel() {
  const rollNonce = useStore((s) => s.rollNonce);
  const phase = useStore((s) => s.phase);
  const markSpinning = useStore((s) => s.markSpinning);
  const lockIn = useStore((s) => s.lockIn);
  const reduced = useReducedMotion();

  const [items, setItems] = useState<ReelItem[]>([]);

  const y = useMotionValue(0);
  const velocity = useVelocity(y);
  // velocity → motion blur on the whole strip (streaking while it flies)
  const blurPx = useTransform(velocity, (v) => Math.min(Math.abs(v) * 0.011, 22));
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  const windowRef = useRef<HTMLDivElement>(null);
  const slotHRef = useRef(DEFAULT_SLOT_H);
  const runIdRef = useRef(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const lastIdxRef = useRef(0);
  const lastTickRef = useRef(0);

  // Per-frame ticking: fire a click each time a new name crosses center,
  // pitched up as the reel slows. Naturally thins out into tension.
  useAnimationFrame((t) => {
    const ph = useStore.getState().phase;
    if (ph !== "spinning" && ph !== "winding") return;
    const idx = centeredIndexAtY(y.get(), slotHRef.current);
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      const v = Math.abs(velocity.get());
      if (v > 80 && t - lastTickRef.current > 28) {
        lastTickRef.current = t;
        sound.tick(Math.min(v / 5200, 1));
      }
    }
  });

  useEffect(() => {
    if (rollNonce === 0) return; // nothing rolled yet
    const { winner, roster } = useStore.getState();
    if (!winner) return;
    const plan = buildReelPlan(roster, winner);
    setItems(plan.items);
    void runRoll(plan);
    return () => {
      runIdRef.current++; // abort any in-flight run
      animRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollNonce]);

  async function runRoll(plan: ReelPlan) {
    const myRun = ++runIdRef.current;
    const alive = () => myRun === runIdRef.current;

    // measure the live slot height so centering is exact at any window size
    const winH = windowRef.current?.clientHeight ?? DEFAULT_SLOT_H * REEL_WINDOW_SLOTS;
    const slotH = winH / REEL_WINDOW_SLOTS;
    slotHRef.current = slotH;
    const yFinal = yForSlot(plan.winnerSlot, slotH);

    animRef.current?.stop();
    y.set(0);
    lastIdxRef.current = centeredIndexAtY(0, slotH);

    // 1 — anticipation wind-up (pull back the opposite way)
    animRef.current = animate(y, reduced ? 0 : 16, {
      duration: 0.16,
      ease: [0.3, 0, 0.2, 1],
    });
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    markSpinning();
    sound.whoosh();

    // 2 — fly + hard decel, ending a touch PAST center (above it)
    const dur = reduced ? 0.9 : 3.5 + Math.random() * 0.7;
    animRef.current = animate(y, yFinal - OVERSHOOT, {
      duration: dur,
      ease: [0.02, 0.86, 0.12, 1],
    });
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    // 3 — under-damped spring rebound onto exact center
    animRef.current = animate(
      y,
      yFinal,
      reduced ? { duration: 0.2 } : { type: "spring", stiffness: 210, damping: 15 },
    );
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    sound.chime();
    lockIn();
  }

  const cls = [
    "reel",
    phase === "spinning" || phase === "winding" ? "is-spinning" : "",
    phase === "locked" ? "is-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <div className="reel-window" ref={windowRef}>
        {items.length > 0 ? (
          <motion.div className="reel-strip" style={{ y, filter }}>
            {items.map((it) => (
              <div
                key={it.key}
                className={`reel-row${
                  it.isWinner && phase === "locked" ? " row-locked" : ""
                }`}
              >
                <span className="reel-name">{it.name}</span>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="reel-idle">
            <span className="reel-idle-kicker">READY</span>
            <span className="reel-idle-text">
              按下 <kbd>空格</kbd> 开始点名
            </span>
          </div>
        )}
      </div>
      <div className="reel-selection" aria-hidden />
      <ParticleBurst />
    </div>
  );
}
