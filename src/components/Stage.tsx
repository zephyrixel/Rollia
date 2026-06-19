import { useStore } from "../state/store";
import { NameReel } from "./NameReel";
import "./Stage.css";

/** The central frosted-glass lens that houses the reel and reacts to phase. */
export function Stage() {
  const phase = useStore((s) => s.phase);
  return (
    <section className={`stage ${phase}`}>
      <NameReel />
    </section>
  );
}
