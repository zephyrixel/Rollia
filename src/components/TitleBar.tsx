import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Wordmark } from "./Wordmark";
import "./TitleBar.css";

/** Frameless custom titlebar: draggable region + window controls. */
export function TitleBar() {
  const safe = (fn: (w: ReturnType<typeof getCurrentWindow>) => Promise<unknown>) => () => {
    try {
      void fn(getCurrentWindow());
    } catch {
      /* not running inside Tauri (e.g. plain browser preview) */
    }
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left" data-tauri-drag-region>
        <Wordmark />
      </div>
      <div className="titlebar-controls">
        <button className="win-btn" onClick={safe((w) => w.minimize())} aria-label="最小化">
          <Minus size={15} />
        </button>
        <button className="win-btn" onClick={safe((w) => w.toggleMaximize())} aria-label="最大化">
          <Square size={12} />
        </button>
        <button
          className="win-btn win-close"
          onClick={safe((w) => w.close())}
          aria-label="关闭"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
}
