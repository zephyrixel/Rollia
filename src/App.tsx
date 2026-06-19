import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AuroraBackground } from "./components/AuroraBackground";
import { TitleBar } from "./components/TitleBar";
import { Stage } from "./components/Stage";
import { HistoryRail } from "./components/HistoryRail";
import { ControlDock } from "./components/ControlDock";
import { RosterPanel } from "./components/RosterPanel";
import { useHotkeys } from "./hooks/useHotkeys";
import { useStore } from "./state/store";
import { sound } from "./lib/sound";
import "./App.css";

function App() {
  useHotkeys();
  const soundOn = useStore((s) => s.settings.sound);
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  // keep the audio engine in sync with the persisted preference
  useEffect(() => {
    sound.setEnabled(soundOn);
  }, [soundOn]);

  // auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(clearToast, 2600);
    return () => window.clearTimeout(t);
  }, [toast, clearToast]);

  return (
    <div className="app">
      <AuroraBackground />
      <TitleBar />

      <main className="app-main">
        <Stage />
      </main>

      <footer className="app-foot">
        <HistoryRail />
        <ControlDock />
      </footer>

      <RosterPanel />

      <div className="toast-layer">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className="toast"
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
