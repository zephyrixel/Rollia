import "./Wordmark.css";

/** The Rollia wordmark: a glowing aurora dot + shimmering gradient type. */
export function Wordmark() {
  return (
    <div className="wordmark" aria-label="Rollia">
      <span className="wordmark-dot" aria-hidden />
      <span className="wordmark-text">Rollia</span>
    </div>
  );
}
