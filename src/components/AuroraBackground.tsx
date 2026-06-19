import { useStore } from "../state/store";
import "./AuroraBackground.css";

/** Saturation / brightness the aurora swells to in each phase. */
const FX: Record<string, { sat: number; bright: number }> = {
  idle: { sat: 1.0, bright: 1.0 },
  winding: { sat: 1.2, bright: 1.07 },
  spinning: { sat: 1.55, bright: 1.18 },
  locked: { sat: 1.32, bright: 1.13 },
};

/**
 * The living backdrop: layered, blurred, screen-blended color fields that
 * drift and breathe, dressed with film grain and a vignette. Its intensity
 * tracks the roll phase, and it flashes a bloom on lock-in.
 *
 * Filter layering (composed top→down so none clobbers another):
 *   .aurora-field  → phase-driven saturate/brightness (inline) + breathe scale
 *   .aurora-hue    → slow hue oscillation
 *   .blob          → heavy blur + drift
 */
export function AuroraBackground() {
  const phase = useStore((s) => s.phase);
  const rollNonce = useStore((s) => s.rollNonce);
  const fx = FX[phase] ?? FX.idle;

  return (
    <div className="aurora-root" aria-hidden>
      <div
        className={`aurora-field${phase === "spinning" ? " is-spinning" : ""}`}
        style={{ filter: `saturate(${fx.sat}) brightness(${fx.bright})` }}
      >
        <div className="aurora-hue">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
          <span className="blob blob-4" />
          <span className="blob blob-5" />
        </div>
      </div>
      <div className="aurora-grain" />
      <div className="aurora-vignette" />
      {phase === "locked" && <div className="aurora-bloom" key={rollNonce} />}
    </div>
  );
}
