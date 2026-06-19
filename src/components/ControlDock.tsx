import { motion } from "motion/react";
import { Infinity as InfinityIcon, Play, Repeat, Users, Volume2, VolumeX } from "lucide-react";
import { useStore } from "../state/store";
import { sound as soundEngine } from "../lib/sound";
import "./ControlDock.css";

/** The bottom command dock: status chip · primary roll button · mini controls. */
export function ControlDock() {
  const phase = useStore((s) => s.phase);
  const rosterLen = useStore((s) => s.roster.length);
  const mode = useStore((s) => s.mode);
  const cyclePicked = useStore((s) => s.cyclePicked);
  const soundOn = useStore((s) => s.settings.sound);
  const toggleSound = useStore((s) => s.toggleSound);
  const toggleMode = useStore((s) => s.toggleMode);
  const toggleRoster = useStore((s) => s.toggleRoster);
  const startRoll = useStore((s) => s.startRoll);

  const rolling = phase === "winding" || phase === "spinning";
  const label = rolling ? "点名中…" : phase === "locked" ? "再来一次" : "开始点名";
  const remaining = Math.max(rosterLen - cyclePicked.length, 0);

  const roll = () => {
    soundEngine.unlock();
    startRoll();
  };

  return (
    <div className="dock">
      <button className="dock-chip" onClick={toggleMode} title="切换点名模式">
        <span className="dock-chip-count">{rosterLen}</span>
        <span className="dock-chip-label">人</span>
        <span className="dock-chip-sep" />
        {mode === "noRepeat" ? (
          <>
            <Repeat size={13} />
            <span>{remaining} 待点</span>
          </>
        ) : (
          <>
            <InfinityIcon size={14} />
            <span>可重复</span>
          </>
        )}
      </button>

      <motion.button
        className={`dock-roll${rolling ? " is-rolling" : ""}`}
        onClick={roll}
        disabled={rolling}
        whileHover={rolling ? undefined : { scale: 1.035 }}
        whileTap={rolling ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
      >
        <Play size={19} fill="currentColor" />
        <span className="dock-roll-label">{label}</span>
        <kbd className="dock-roll-kbd">Space</kbd>
      </motion.button>

      <div className="dock-mini">
        <button
          className="dock-icon"
          onClick={toggleSound}
          title="静音 / 取消静音 (M)"
          aria-pressed={!soundOn}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button className="dock-icon" onClick={toggleRoster} title="名单 (R)">
          <Users size={18} />
        </button>
      </div>
    </div>
  );
}
