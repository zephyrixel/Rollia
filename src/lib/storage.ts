import type { HistoryEntry, Mode, Person, Settings } from "../state/types";
import { uid } from "./random";

/** Persistence layer. localStorage today; isolated here so it can later
 *  be swapped for the Tauri store plugin without touching the store. */

const KEY = {
  roster: "rollia.roster.v1",
  history: "rollia.history.v1",
  mode: "rollia.mode.v1",
  settings: "rollia.settings.v1",
  cycle: "rollia.cycle.v1",
} as const;

/** A lively sample class so the canvas feels alive on first launch. */
const SAMPLE_NAMES = [
  "林晚星", "沈知夏", "顾屿", "苏沐然", "陆既明", "江照", "温言",
  "白鹭", "宋时予", "周樘", "叶疏桐", "傅深", "许清欢", "蒋寒",
  "钟离", "夏星river", "唐九", "韩沉", "祁画", "卫珩",
  "Mateo", "Aria", "Kenji", "Noor",
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — non-fatal for an art piece */
  }
}

export function loadRoster(): Person[] {
  const stored = read<Person[] | null>(KEY.roster, null);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  // First run → seed the sample roster.
  const seeded = SAMPLE_NAMES.map((name) => ({ id: uid(), name }));
  write(KEY.roster, seeded);
  return seeded;
}

export const loadHistory = (): HistoryEntry[] => read<HistoryEntry[]>(KEY.history, []);
export const loadMode = (): Mode => read<Mode>(KEY.mode, "noRepeat");
export const loadCycle = (): string[] => read<string[]>(KEY.cycle, []);
export const loadSettings = (): Settings => read<Settings>(KEY.settings, { sound: true });

export const saveRoster = (v: Person[]) => write(KEY.roster, v);
export const saveHistory = (v: HistoryEntry[]) => write(KEY.history, v);
export const saveMode = (v: Mode) => write(KEY.mode, v);
export const saveCycle = (v: string[]) => write(KEY.cycle, v);
export const saveSettings = (v: Settings) => write(KEY.settings, v);
