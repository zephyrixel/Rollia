import { create } from "zustand";
import type { HistoryEntry, Mode, Person, Phase, Settings, Toast } from "./types";
import { pickRandom, uid } from "../lib/random";
import {
  loadCycle,
  loadHistory,
  loadMode,
  loadRoster,
  loadSettings,
  saveCycle,
  saveHistory,
  saveMode,
  saveRoster,
  saveSettings,
} from "../lib/storage";

/** Split a pasted blob into clean names.
 *  Separators: newlines, tabs, ASCII/fullwidth commas, 顿号, semicolons,
 *  fullwidth spaces, and runs of 2+ ASCII spaces (so "Mary Jane" survives). */
function parseNames(raw: string): string[] {
  return raw
    .replace(/　/g, "\n")
    .replace(/ {2,}/g, "\n")
    .split(/[\n\r,，、;；\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

let toastSeq = 0;

interface RolliaState {
  // ---- persisted domain ----
  roster: Person[];
  history: HistoryEntry[];
  mode: Mode;
  cyclePicked: string[]; // ids picked in the current no-repeat round
  settings: Settings;

  // ---- ephemeral ----
  phase: Phase;
  winner: Person | null;
  rollNonce: number; // bumps on every startRoll, even for identical winners
  rosterOpen: boolean;
  toast: Toast | null;

  // ---- actions ----
  addNames: (raw: string) => void;
  removeName: (id: string) => void;
  clearRoster: () => void;
  toggleMode: () => void;
  toggleSound: () => void;
  openRoster: () => void;
  closeRoster: () => void;
  toggleRoster: () => void;
  setToast: (text: string) => void;
  clearToast: () => void;

  startRoll: () => void;
  markSpinning: () => void;
  lockIn: () => void;
  resetToIdle: () => void;
}

function initialCycle(roster: Person[]): string[] {
  const ids = new Set(roster.map((p) => p.id));
  return loadCycle().filter((id) => ids.has(id));
}

const initialRoster = loadRoster();

export const useStore = create<RolliaState>((set, get) => ({
  roster: initialRoster,
  history: loadHistory(),
  mode: loadMode(),
  cyclePicked: initialCycle(initialRoster),
  settings: loadSettings(),

  phase: "idle",
  winner: null,
  rollNonce: 0,
  rosterOpen: false,
  toast: null,

  addNames: (raw) => {
    const incoming = parseNames(raw);
    if (!incoming.length) return;
    set((s) => {
      const seen = new Set(s.roster.map((p) => p.name.toLowerCase()));
      const additions: Person[] = [];
      for (const name of incoming) {
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        additions.push({ id: uid(), name });
      }
      if (!additions.length) return s;
      return { roster: [...s.roster, ...additions] };
    });
  },

  removeName: (id) =>
    set((s) => ({
      roster: s.roster.filter((p) => p.id !== id),
      cyclePicked: s.cyclePicked.filter((x) => x !== id),
    })),

  clearRoster: () =>
    set({ roster: [], cyclePicked: [], winner: null, phase: "idle" }),

  toggleMode: () =>
    set((s) => ({
      mode: s.mode === "noRepeat" ? "reusable" : "noRepeat",
      cyclePicked: [],
    })),

  toggleSound: () =>
    set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),

  openRoster: () => set({ rosterOpen: true }),
  closeRoster: () => set({ rosterOpen: false }),
  toggleRoster: () => set((s) => ({ rosterOpen: !s.rosterOpen })),

  setToast: (text) => set({ toast: { id: ++toastSeq, text } }),
  clearToast: () => set({ toast: null }),

  startRoll: () => {
    const s = get();
    if (s.phase === "winding" || s.phase === "spinning") return; // mid-roll: ignore
    if (s.roster.length === 0) {
      get().setToast("先添加一些名字吧 ✦");
      get().openRoster();
      return;
    }
    let cycle = s.cyclePicked;
    let pool = s.roster;
    if (s.mode === "noRepeat") {
      pool = s.roster.filter((p) => !cycle.includes(p.id));
      if (pool.length === 0) {
        cycle = [];
        pool = s.roster;
        get().setToast("新一轮 · 所有人重新登场");
      }
    }
    const winner = pickRandom(pool);
    set({
      winner,
      phase: "winding",
      cyclePicked: cycle,
      rollNonce: s.rollNonce + 1,
    });
  },

  markSpinning: () => set({ phase: "spinning" }),

  lockIn: () => {
    const s = get();
    if (!s.winner) return;
    const entry: HistoryEntry = {
      id: s.winner.id,
      name: s.winner.name,
      at: Date.now(),
    };
    const history = [entry, ...s.history].slice(0, 60);
    let cyclePicked = s.cyclePicked;
    if (s.mode === "noRepeat" && !cyclePicked.includes(s.winner.id)) {
      cyclePicked = [...cyclePicked, s.winner.id];
    }
    set({ phase: "locked", history, cyclePicked });
  },

  resetToIdle: () => set({ phase: "idle" }),
}));

// ---- persistence: write only the slices that actually changed ----
useStore.subscribe((state, prev) => {
  if (state.roster !== prev.roster) saveRoster(state.roster);
  if (state.history !== prev.history) saveHistory(state.history);
  if (state.mode !== prev.mode) saveMode(state.mode);
  if (state.cyclePicked !== prev.cyclePicked) saveCycle(state.cyclePicked);
  if (state.settings !== prev.settings) saveSettings(state.settings);
});
