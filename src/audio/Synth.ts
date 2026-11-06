import { frequency } from '../instrument/tuning';
import { DEFAULTS, type Timbre } from '../instrument/settings';

interface Voice {
  oscillator: OscillatorNode;
  envelope: GainNode;
  filter: BiquadFilterNode;
  startedAt: number;
}

export type AudioStatus = 'off' | 'ready' | 'suspended' | 'error';

export class Synth {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Map<string, Voice>();
  private volume = DEFAULTS.volume;
  onStatus: (status: AudioStatus) => void = () => {};

  get voiceCount() {
    return this.voices.size;
  }

  async enable() {
    try {
      // Safari's default ambient session can be muted by the iPhone silent switch.
      const session = (
        globalThis.navigator as
          | (Navigator & {
              audioSession?: { type: string };
            })
          | undefined
      )?.audioSession;

      if (session) {
        try {
          session.type = 'playback';
        } catch {
          /* Older implementations may expose a read-only session. */
        }
      }

      if ((this.context?.state as string) === 'interrupted') this.dispose();

      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext({ latencyHint: 'interactive' });
        this.master = this.context.createGain();
        this.master.gain.value = this.volume;
        const limiter = this.context.createDynamicsCompressor();

        limiter.threshold.value = -12;
        limiter.knee.value = 12;
        limiter.ratio.value = 12;
        this.master.connect(limiter);
        limiter.connect(this.context.destination);

        this.context.onstatechange = () => {
          const ready = this.context?.state === 'running';

          if (!ready) this.releaseAll();
          this.onStatus(ready ? 'ready' : 'suspended');
        };
      }

      // Schedule output synchronously within the activation gesture, before awaiting resume.
      const context = this.context;
      const resume = context.resume();
      const unlock = context.createBufferSource();

      unlock.buffer = context.createBuffer(1, 1, context.sampleRate);
      unlock.connect(context.destination);
      unlock.onended = () => unlock.disconnect();
      unlock.start();
      await resume;
      if (this.context !== context) return;
      this.onStatus(this.context.state === 'running' ? 'ready' : 'suspended');
    } catch {
      this.onStatus('error');
    }
  }

  setVolume(volume: number) {
    this.volume = volume;
    this.master?.gain.setTargetAtTime(volume, this.context!.currentTime, 0.015);
  }

  start(id: string, step: number, edo: number, timbre: Timbre): boolean {
    if (!this.context || !this.master || this.context.state !== 'running' || this.voices.size >= 36)
      return false;
    this.release(id);
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const now = this.context.currentTime;

    oscillator.type = timbre;
    oscillator.frequency.value = Math.min(20000, Math.max(8, frequency(step, edo)));
    filter.type = 'lowpass';
    filter.frequency.value = timbre === 'sawtooth' ? 2200 : 16000;
    filter.Q.value = 0.5;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.13, now + 0.012);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    oscillator.start();
    this.voices.set(id, { oscillator, envelope, filter, startedAt: now });

    return true;
  }

  bend(id: string, step: number, edo: number) {
    if (!this.context) return;

    this.voices
      .get(id)
      ?.oscillator.frequency.setTargetAtTime(
        Math.min(20000, Math.max(8, frequency(step, edo))),
        this.context.currentTime,
        0.008,
      );
  }

  release(id: string) {
    const voice = this.voices.get(id);

    if (!voice || !this.context) return;
    const now = this.context.currentTime;

    // The envelope is a known linear attack; avoid cancelAndHoldAtTime, absent in
    // some desktop engines. Preserve the attack level even for very short taps.
    const level = 0.13 * Math.min(1, Math.max(0, (now - voice.startedAt) / 0.012));

    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(level, now);
    voice.envelope.gain.linearRampToValueAtTime(0, now + 0.045);
    voice.oscillator.stop(now + 0.05);

    voice.oscillator.onended = () => {
      voice.oscillator.disconnect();
      voice.filter.disconnect();
      voice.envelope.disconnect();
    };

    this.voices.delete(id);
  }

  releaseAll() {
    for (const id of this.voices.keys()) this.release(id);
  }

  dispose() {
    this.releaseAll();

    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close().catch(() => {});
      this.context = undefined;
      this.master = undefined;
    }
  }
}
