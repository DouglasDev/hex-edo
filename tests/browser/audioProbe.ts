export type Audit = {
  context: AudioContext;
  voices: { oscillator: OscillatorNode; stopped: boolean }[];
};

export async function installProbe(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const audit = {
      context: undefined as AudioContext | undefined,
      voices: [] as { oscillator: OscillatorNode; stopped: boolean }[],
    };

    Object.assign(window, { synthAudit: audit });

    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        audit.context = this;
      }

      createOscillator() {
        const oscillator = super.createOscillator();
        const stop = oscillator.stop.bind(oscillator);
        const voice = { oscillator, stopped: false };

        audit.voices.push(voice);

        oscillator.stop = (when?: number) => {
          voice.stopped = true;
          stop(when);
        };

        return oscillator;
      }
    };
  });
}
