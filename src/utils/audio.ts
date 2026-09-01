// Web Audio API Sound Synthesizer & Speech Narration

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public voiceEnabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a pleasant success chime for solving a hazard
  playSuccess(combo: number = 1) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFreq = 523.25; // C5
    const pitchMultiplier = Math.min(1.5, 1 + (combo - 1) * 0.08);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * pitchMultiplier, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    // Add bright harmonic sparkle
    const sparkleOsc = this.ctx.createOscillator();
    const sparkleGain = this.ctx.createGain();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(1046.5 * pitchMultiplier, now + 0.05);
    sparkleOsc.frequency.exponentialRampToValueAtTime(1318.5 * pitchMultiplier, now + 0.25);
    sparkleGain.gain.setValueAtTime(0.2, now + 0.05);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(this.ctx.destination);
    sparkleOsc.start(now + 0.05);
    sparkleOsc.stop(now + 0.3);
  }

  // Hazard valve turning lock sound
  playValveTurn() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic heavy click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Window opening whoosh
  playWindowWhoosh() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.25);
  }

  // Wipe / Sponge squeak
  playWipe() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.08);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.16);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Phone dial & connect chime
  playPhoneCall() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual Tone Multi-Frequency DTMF simulation
    const freqs = [697, 1209];
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  // Failure warning buzzer (-100 pts)
  playFailure() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Gas hiss alarm sound for hazard emergence
  playHazardWarning() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(440, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Victory fanfare
  playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const melody = [
      { note: 523.25, time: 0, dur: 0.15 },    // C5
      { note: 659.25, time: 0.15, dur: 0.15 }, // E5
      { note: 783.99, time: 0.3, dur: 0.15 },  // G5
      { note: 1046.5, time: 0.45, dur: 0.4 },  // C6
    ];

    melody.forEach(m => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.note, now + m.time);
      gain.gain.setValueAtTime(0.25, now + m.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + m.time + m.dur);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + m.time);
      osc.stop(now + m.time + m.dur);
    });
  }

  // Achievement unlock bell
  playAchievement() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [784, 987.77, 1174.66, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  // Korean Text-to-Speech narration
  speak(text: string) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is blocked
    }
  }

  stopVoice() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundManager = new SoundManager();
