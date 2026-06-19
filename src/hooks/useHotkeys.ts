import { useEffect } from "react";
import { useStore } from "../state/store";
import { sound } from "../lib/sound";

/**
 * Global shortcuts:
 *   Space — start / restart a roll (ignored mid-roll by the store)
 *   R     — toggle the roster drawer
 *   M     — mute / unmute
 *   Esc   — close the roster drawer (works even from inputs)
 * Typing in an input/textarea suppresses Space/R/M so names can be edited.
 */
export function useHotkeys(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;

      if (e.key === "Escape") {
        useStore.getState().closeRoster();
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }
      if (editable) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        sound.unlock();
        useStore.getState().startRoll();
      } else if (e.key === "r" || e.key === "R") {
        useStore.getState().toggleRoster();
      } else if (e.key === "m" || e.key === "M") {
        useStore.getState().toggleSound();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
