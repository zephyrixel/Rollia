import type { Person } from "../state/types";
import { randInt, shuffle } from "./random";

/* ============================================================
   Reel geometry & sequence construction.

   Slot height is responsive (CSS clamp on --reel-slot-h), so the
   live pixel value is measured at roll time and threaded through
   yForSlot / centeredIndexAtY. CENTER_INDEX and REEL_WINDOW_SLOTS
   mirror NameReel.css (strip offset uses CENTER_INDEX + 0.5 = 2.5;
   window height = slot * REEL_WINDOW_SLOTS).
   ============================================================ */

export const DEFAULT_SLOT_H = 120;
export const REEL_WINDOW_SLOTS = 3.4;
export const CENTER_INDEX = 2;
/** How far (px) the reel flies *past* center before the spring pulls it back. */
export const OVERSHOOT = 40;

export interface ReelItem {
  key: string;
  name: string;
  isWinner: boolean;
}

export interface ReelPlan {
  items: ReelItem[];
  winnerSlot: number;
}

/**
 * Build a long reel that ends on `winner`. The winner sits deep in the strip
 * (slot 36–52) for drama, with trailing decoys so the spring overshoot reveals
 * names below before snapping back.
 */
export function buildReelPlan(roster: readonly Person[], winner: Person): ReelPlan {
  const winnerSlot = randInt(36, 52);
  const trailing = 7;
  const items: ReelItem[] = [];

  // Draw decoys from a reshuffling bag for an organic, non-repeating cadence.
  let bag: Person[] = [];
  const draw = (): Person => {
    if (bag.length === 0) bag = shuffle(roster);
    return bag.pop() as Person;
  };

  for (let i = 0; i < winnerSlot; i++) {
    items.push({ key: `d${i}`, name: draw().name, isWinner: false });
  }
  items.push({ key: "winner", name: winner.name, isWinner: true });
  for (let i = 0; i < trailing; i++) {
    items.push({ key: `t${i}`, name: draw().name, isWinner: false });
  }

  return { items, winnerSlot };
}

/** translateY that lands `slot` dead-center, given the live slot height. */
export const yForSlot = (slot: number, slotH: number): number =>
  (CENTER_INDEX - slot) * slotH;

/** Which strip index is under the center line at translateY `y`. */
export const centeredIndexAtY = (y: number, slotH: number): number =>
  Math.round(CENTER_INDEX - y / slotH);
