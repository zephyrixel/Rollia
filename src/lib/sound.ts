/* ============================================================
   Rollia — synthesized sound engine (Web Audio, zero assets).
   whoosh on launch · ticks while flying · chime on lock-in.
   A single lazily-created AudioContext, unlocked on first gesture.
   ============================================================ */

type Ctx = AudioContext;

class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private noiseBuffer: AudioBuffer | null = null;

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v && this.ctx) {
      // soft-cancel any ringing tails
      this.master?.gain.cancelScheduledValues(this.ctx.currentTime);
    }
  }

  private ensure(): Ctx | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Call from a user gesture to satisfy autoplay policy. */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  private noise(ctx: Ctx): AudioBuffer {
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.8);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  /** Fast click; pitch rises slightly as the reel slows (speed01: 1 fast → 0 slow). */
  tick(speed01 = 0.5): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 880 + (1 - speed01) * 950;
    bp.Q.value = 6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.06);
  }

  /** Airy launch whoosh: noise through a swept low-pass. */
  whoosh(): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const dur = 0.7;

    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx);
    src.playbackRate.value = 0.8;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 1.3;
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.linearRampToValueAtTime(2200, t + 0.2);
    lp.frequency.exponentialRampToValueAtTime(160, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /** Bright resolving bell on lock-in. */
  chime(): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    // A warm, slightly shimmering major chord.
    const partials: Array<[freq: number, gain: number, dur: number]> = [
      [440, 0.1, 1.7],
      [660, 0.1, 1.5],
      [880, 0.11, 1.4],
      [1320, 0.07, 1.1],
      [1760, 0.05, 0.9],
    ];

    for (const [freq, gain, dur] of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 6;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    // Tiny high sparkle transient.
    const sp = ctx.createOscillator();
    sp.type = "triangle";
    sp.frequency.setValueAtTime(2640, t);
    sp.frequency.exponentialRampToValueAtTime(3520, t + 0.18);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    sp.connect(sg).connect(this.master);
    sp.start(t);
    sp.stop(t + 0.34);
  }
}

export const sound = new SoundEngine();
