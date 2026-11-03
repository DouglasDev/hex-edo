import { test, expect } from '@playwright/test';
import { makeLayout } from '../../src/instrument/layout';

type Audit = { context: AudioContext; voices: { oscillator: OscillatorNode; stopped: boolean }[] };

async function installProbe(page: import('@playwright/test').Page) {
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

test('mobile touch activation and operating-system-style audio interruption', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Touch devices only.');
  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).tap();
  await expect(page.getByRole('status')).toHaveText('Audio on');
  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Keyboard missing');
  const layout = makeLayout(box.width, box.height, 76, false, { edo: 7, a: 1, b: 4, register: 0 });
  const key = layout.keys[Math.floor(layout.keys.length / 2)];

  await page.touchscreen.tap(box.x + key.x, box.y + key.y);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const audit = (window as unknown as { synthAudit: Audit }).synthAudit;

        return audit.voices.length;
      }),
    )
    .toBe(1);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { synthAudit: Audit }).synthAudit.voices.filter((v) => !v.stopped)
            .length,
      ),
    )
    .toBe(0);

  await page.evaluate(() =>
    (window as unknown as { synthAudit: Audit }).synthAudit.context.suspend(),
  );

  await expect(page.getByRole('button', { name: 'Resume audio' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume audio' }).tap();
  await expect(page.getByRole('status')).toHaveText('Audio on');
});

test('Android multitouch bends one voice while another holds and rotation releases both', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'android-chromium', 'Chromium touch protocol test.');
  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).tap();
  await expect(page.getByRole('status')).toHaveText('Audio on');
  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Keyboard missing');
  const layout = makeLayout(box.width, box.height, 76, false, { edo: 7, a: 1, b: 4, register: 0 });
  const first = layout.keys[Math.floor(layout.keys.length / 2)];
  const second = layout.keys[Math.floor(layout.keys.length / 2) + 1];
  const one = { id: 1, x: box.x + first.x, y: box.y + first.y };
  const two = { id: 2, x: box.x + second.x, y: box.y + second.y };
  const session = await context.newCDPSession(page);

  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [one, two] });

  const pitches = () =>
    page.evaluate(() =>
      (window as unknown as { synthAudit: Audit }).synthAudit.voices
        .filter((v) => !v.stopped)
        .map((v) => v.oscillator.frequency.value),
    );

  await expect.poll(async () => (await pitches()).length).toBe(2);
  const initial = await pitches();

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ ...one, x: one.x + 15 }, two],
  });

  await expect.poll(async () => Math.abs((await pitches())[0] - initial[0])).toBeGreaterThan(1);
  expect((await pitches())[1]).toBeCloseTo(initial[1], 4);
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(page.getByText('Rotate your phone')).toBeVisible();
  await expect.poll(async () => (await pitches()).length).toBe(0);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
});
