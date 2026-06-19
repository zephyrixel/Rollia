/** Core domain types for Rollia. */

export interface Person {
  id: string;
  name: string;
}

export interface HistoryEntry {
  id: string; // person id
  name: string;
  at: number; // epoch ms
}

/** The roll lifecycle.
 *  idle    → nothing happening, awaiting input
 *  winding → anticipation wind-up before launch
 *  spinning→ reel flying / decelerating
 *  locked  → winner settled, climax shown
 */
export type Phase = "idle" | "winding" | "spinning" | "locked";

/** reusable: anyone can be picked every time.
 *  noRepeat: nobody repeats until the whole roster has been called (then a new round begins). */
export type Mode = "reusable" | "noRepeat";

export interface Settings {
  sound: boolean;
}

export interface Toast {
  id: number;
  text: string;
}
