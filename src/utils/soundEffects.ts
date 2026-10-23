/**
 * Web Audio API synthesized UI sound effects.
 * Zero external audio files required - works 100% offline and in all environments.
 */

export function playExportCompleteSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic three-tone victory chime (E5 -> A5 -> C#6)
    const playTone = (freq: number, start: number, duration: number, volume: number = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(659.25, now, 0.35, 0.12);
    playTone(880.00, now + 0.12, 0.45, 0.15);
    playTone(1108.73, now + 0.25, 0.65, 0.18);
  } catch (e) {
    console.warn('[Audio] Could not play export chime:', e);
  }
}
