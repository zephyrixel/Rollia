import { AnimatePresence, motion } from "motion/react";
import { useStore } from "../state/store";
import "./HistoryRail.css";

/** Recently-called names as chips; newest springs in on the left. */
export function HistoryRail() {
  const history = useStore((s) => s.history);
  const mode = useStore((s) => s.mode);
  const rosterLen = useStore((s) => s.roster.length);
  const cyclePicked = useStore((s) => s.cyclePicked);
  const shown = history.slice(0, 14);

  return (
    <div className="history-rail">
      {mode === "noRepeat" && rosterLen > 0 && (
        <div className="history-progress" title="本轮进度">
          本轮 {cyclePicked.length}/{rosterLen}
        </div>
      )}
      <div className="history-chips">
        <AnimatePresence initial={false}>
          {shown.map((h, i) => (
            <motion.span
              key={`${h.at}-${h.id}`}
              layout
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              animate={{ opacity: i === 0 ? 1 : 0.62 - i * 0.03, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`history-chip${i === 0 ? " is-latest" : ""}`}
            >
              {h.name}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
