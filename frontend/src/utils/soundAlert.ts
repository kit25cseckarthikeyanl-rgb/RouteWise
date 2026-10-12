// Web Audio API emergency dispatch alert sound generator with browser autoplay handling
let audioCtx: AudioContext | null = null;
let isMutedState = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  return audioCtx;
}

export const soundAlert = {
  isMuted(): boolean {
    return isMutedState;
  },

  setMuted(muted: boolean) {
    isMutedState = muted;
  },

  async resumeContext(): Promise<boolean> {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        return (ctx.state as string) === 'running';
      } catch {
        return false;
      }
    }
    return ctx.state === 'running';
  },

  isAutoplayBlocked(): boolean {
    const ctx = getAudioContext();
    return ctx ? ctx.state === 'suspended' : false;
  },

  /**
   * Plays a distinct 2-second dual-tone emergency alert chime.
   */
  playEmergencySiren(): boolean {
    if (isMutedState) return false;

    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      if (ctx.state === 'suspended') return false;
    }

    try {
      const now = ctx.currentTime;

      // Pulse 1: 960 Hz High Alert Beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1174, now + 0.3);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Pulse 2: 1174 Hz Rapid Echo
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1174, now + 0.45);
      osc2.frequency.exponentialRampToValueAtTime(1480, now + 0.8);

      gain2.gain.setValueAtTime(0.001, now + 0.45);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.5);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.45);
      osc2.stop(now + 0.9);

      // Pulse 3: Resonant Confirmation
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(987, now + 0.95);
      gain3.gain.setValueAtTime(0.2, now + 0.95);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.95);
      osc3.stop(now + 1.35);

      return true;
    } catch (err) {
      console.warn('Audio playback interrupted:', err);
      return false;
    }
  },
};
