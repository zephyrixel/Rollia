import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  DEFAULT_SLOT_H,
  OVERSHOOT,
  REEL_WINDOW_SLOTS,
  type ReelItem,
  type ReelPlan,
} from "../lib/reel";
import { sound } from "../lib/sound";
import { ParticleBurst } from "./ParticleBurst";
import "./NameReel.css";

const LEADING_BUFFER_SLOTS = 12;
const VIRTUAL_OVERSCAN = 12;
const MAX_MOTION_BLUR_PX = 26;
// Keep the scrollport outside the masked viewport so blur sampling is not
// clipped at the visible edge while names enter the reel.
const BLUR_GUARD_PX = MAX_MOTION_BLUR_PX + 12;

const scrollForSlot = (slot: number, slotH: number, winH: number): number =>
  slot * slotH - (winH - slotH) / 2;

const centeredIndexAtScroll = (scrollTop: number, slotH: number, winH: number): number =>
  Math.round((scrollTop + (winH - slotH) / 2) / slotH);

/**
 * The reel is implemented as a programmatically driven virtual list. Each roll
 * appends the next plan to the tail, then Motion animates scrollTop through that
 * continuous list. TanStack Virtual keeps the DOM bounded to the viewport area,
 * so repeated rolls do not grow a large hidden strip.
 */
export function NameReel() {
  const rollNonce = useStore((s) => s.rollNonce);
  const phase = useStore((s) => s.phase);
  const markSpinning = useStore((s) => s.markSpinning);
  const lockIn = useStore((s) => s.lockIn);
  const reduced = useReducedMotion();

  const [items, setItems] = useState<ReelItem[]>([]);
  const [pendingPlan, setPendingPlan] = useState<ReelPlan | null>(null);
  const [lockedWinnerKey, setLockedWinnerKey] = useState<string | null>(null);

  const itemsRef = useRef<ReelItem[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const slotHRef = useRef(DEFAULT_SLOT_H);
  const windowHRef = useRef(DEFAULT_SLOT_H * REEL_WINDOW_SLOTS);
  const runIdRef = useRef(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const lastIdxRef = useRef(0);
  const lastTickRef = useRef(0);

  const scrollTop = useMotionValue(0);
  const velocity = useVelocity(scrollTop);
  const blurPx = useTransform(velocity, (v) => {
    const b = Math.min(Math.abs(v) * 0.012, MAX_MOTION_BLUR_PX);
    return Math.round(b / 2) * 2;
  });
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => windowRef.current,
    estimateSize: () => slotHRef.current,
    overscan: VIRTUAL_OVERSCAN,
  });

  useEffect(() => {
    return scrollTop.on("change", (latest) => {
      const el = windowRef.current;
      if (el) el.scrollTop = latest;
    });
  }, [scrollTop]);

  // Per-frame ticking: fire a click each time a new name crosses center,
  // pitched up as the reel slows. Naturally thins out into tension.
  useAnimationFrame((t) => {
    const ph = useStore.getState().phase;
    if (ph !== "spinning" && ph !== "winding") return;
    const idx = centeredIndexAtScroll(scrollTop.get(), slotHRef.current, windowHRef.current);
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      const v = Math.abs(velocity.get());
      if (v > 80 && t - lastTickRef.current > 28) {
        lastTickRef.current = t;
        sound.tick(Math.min(v / 5200, 1));
      }
    }
  });

  useLayoutEffect(() => {
    if (rollNonce === 0) return; // nothing rolled yet
    const { winner, roster } = useStore.getState();
    if (!winner) return;
    const plan = appendReelPlan(buildReelPlan(roster, winner), rollNonce);
    setLockedWinnerKey(null);
    setPendingPlan(plan);
    return () => {
      runIdRef.current++; // abort any in-flight run
      animRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollNonce]);

  useLayoutEffect(() => {
    if (!pendingPlan) return;
    rowVirtualizer.measure();
    void runRoll(pendingPlan);
    setPendingPlan(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlan, items.length]);

  function appendReelPlan(plan: ReelPlan, nonce: number): ReelPlan {
    const slotH = slotHRef.current;
    const winH = windowHRef.current;
    const centerSlot = Math.max(centeredIndexAtScroll(scrollTop.get(), slotH, winH), 0);
    const pruneCount = Math.min(
      Math.max(centerSlot - LEADING_BUFFER_SLOTS, 0),
      itemsRef.current.length,
    );

    if (pruneCount > 0) {
      itemsRef.current = itemsRef.current.slice(pruneCount);
      scrollTop.set(Math.max(0, scrollTop.get() - pruneCount * slotH));
      lastIdxRef.current = centeredIndexAtScroll(scrollTop.get(), slotH, winH);
    }

    const baseSlot = itemsRef.current.length;
    const nextItems = plan.items.map((item) => ({
      ...item,
      key: `r${nonce}-${item.key}`,
    }));
    const appended = [...itemsRef.current, ...nextItems];
    itemsRef.current = appended;
    setItems(appended);
    return {
      items: appended,
      winnerSlot: baseSlot + plan.winnerSlot,
    };
  }

  async function runRoll(plan: ReelPlan) {
    const myRun = ++runIdRef.current;
    const alive = () => myRun === runIdRef.current;

    const visibleH =
      viewportRef.current?.clientHeight ??
      windowRef.current?.clientHeight ??
      DEFAULT_SLOT_H * REEL_WINDOW_SLOTS;
    const winH = windowRef.current?.clientHeight ?? visibleH;
    const slotH = visibleH / REEL_WINDOW_SLOTS;
    slotHRef.current = slotH;
    windowHRef.current = winH;
    rowVirtualizer.measure();

    const scrollStart = scrollTop.get();
    const scrollFinal = scrollForSlot(plan.winnerSlot, slotH, winH);

    animRef.current?.stop();
    lastIdxRef.current = centeredIndexAtScroll(scrollStart, slotH, winH);

    // Pull the list down from its current settled position, then let the newly
    // appended tail continue upward into view.
    animRef.current = animate(scrollTop, reduced ? scrollStart : Math.max(0, scrollStart - 16), {
      duration: 0.16,
      ease: [0.3, 0, 0.2, 1],
    });
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    markSpinning();
    sound.whoosh();

    const dur = reduced ? 0.9 : 3.5 + Math.random() * 0.7;
    animRef.current = animate(scrollTop, scrollFinal + OVERSHOOT, {
      duration: dur,
      ease: [0.02, 0.86, 0.12, 1],
    });
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    animRef.current = animate(
      scrollTop,
      scrollFinal,
      reduced ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 13 },
    );
    await animRef.current.finished.catch(() => {});
    if (!alive()) return;

    sound.chime();
    setLockedWinnerKey(plan.items[plan.winnerSlot]?.key ?? null);
    lockIn();
  }

  const cls = [
    "reel",
    phase === "spinning" || phase === "winding" ? "is-spinning" : "",
    phase === "locked" ? "is-locked" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const reelStyle = { "--reel-blur-guard": `${BLUR_GUARD_PX}px` } as CSSProperties;

  return (
    <div className={cls} style={reelStyle}>
      <div className="reel-viewport" ref={viewportRef}>
        {items.length > 0 ? (
          <div className="reel-window" ref={windowRef}>
            <motion.div
              className="reel-strip"
              style={{ height: rowVirtualizer.getTotalSize(), filter }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = items[virtualRow.index];
                if (!item) return null;
                return (
                  <div
                    key={item.key}
                    className={`reel-row${
                      item.key === lockedWinnerKey && phase === "locked" ? " row-locked" : ""
                    }`}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <span className="reel-name">{item.name}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
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
