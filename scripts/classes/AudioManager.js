// Sound effects synthesized with the Web Audio API (no external audio files).
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.presets = {
      click: [660, 0.05, 'square'], hit: [140, 0.15, 'sawtooth'], crit: [90, 0.3, 'sawtooth'],
      miss: [300, 0.1, 'sine'], heal: [880, 0.25, 'sine'], win: [1040, 0.5, 'triangle'], lose: [110, 0.6, 'triangle']
    };
  }

  play(kind) {
    if (this.muted) return;
    this.ctx ??= new AudioContext();
    const [freq, duration, wave] = this.presets[kind] || this.presets.click;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(now + duration);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
