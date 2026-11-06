import { test, expect } from './fixtures';
import { diameterForRows } from '../../src/instrument/keySize';
import { makeLayout } from '../../src/instrument/layout';

import { installProbe, type Audit } from './audioProbe';

test('mobile touch activation and operating-system-style audio interruption', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop'), 'Touch devices only.');
  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).tap();

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
    )
    .toBe('running');

  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Keyboard missing');
  const layout = makeLayout(box.width, box.height, diameterForRows(box.height), false, {
    edo: 7,
    a: 1,
    b: 4,
    register: 0,
  });
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

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
    )
    .toBe('running');

  await page.getByRole('button', { name: 'Settings', exact: true }).click();

  await page.evaluate(() =>
    Object.assign(window, {
      previousContext: (window as unknown as { synthAudit: Audit }).synthAudit.context,
    }),
  );

  await page.getByRole('button', { name: 'Restart audio' }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { previousContext: AudioContext; synthAudit: Audit })
            .previousContext !== (window as unknown as { synthAudit: Audit }).synthAudit.context,
      ),
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume audio' })).toHaveCount(0);
});

test('Android multitouch bends one voice while another holds and rotation releases both', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'android-chromium', 'Chromium touch protocol test.');
  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).tap();

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
    )
    .toBe('running');

  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Keyboard missing');
  const layout = makeLayout(box.width, box.height, diameterForRows(box.height), false, {
    edo: 7,
    a: 1,
    b: 4,
    register: 0,
  });
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

  // Change emulated phone orientation without resizing the native fullscreen browser window.
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  });

  await expect(page.getByRole('button', { name: 'Start playing' })).toBeVisible();
  await expect.poll(async () => (await pitches()).length).toBe(0);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
});

for (const mode of ['pointer', 'touch']) {
  test(`three fingers land and release independently with ${mode} input`, async ({
    page,
    context,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'android-chromium',
      'Native Chromium three-finger protocol.',
    );

    await installProbe(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Touch input', { exact: true }).selectOption(mode);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Enable audio' }).tap();

    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
      )
      .toBe('running');

    const box = await page.getByTestId('keyboard').boundingBox();

    if (!box) throw new Error('Keyboard missing');
    const layout = makeLayout(box.width, box.height, diameterForRows(box.height), false, {
      edo: 7,
      a: 1,
      b: 4,
      register: 0,
    });
    const keys = layout.keys.filter((key) => key.r === 2).slice(2, 5);
    const points = keys.map((key, id) => ({ id: id + 1, x: box.x + key.x, y: box.y + key.y }));
    const session = await context.newCDPSession(page);

    const active = () =>
      page.evaluate(
        () =>
          (window as unknown as { synthAudit: Audit }).synthAudit.voices.filter((v) => !v.stopped)
            .length,
      );

    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
    await expect.poll(active).toBe(3);

    expect(
      await page.evaluate(
        () => (window as unknown as { synthAudit: Audit }).synthAudit.voices.length,
      ),
    ).toBe(3);

    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: points.slice(0, 1),
    });

    await expect.poll(active).toBe(2);
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect.poll(active).toBe(0);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
    await expect.poll(active).toBe(3);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(active).toBe(0);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByText('Contacts: 0 · peak: 3 · cancellations: 2')).toBeVisible();

    await page
      .getByLabel('Touch input', { exact: true })
      .selectOption(mode === 'pointer' ? 'touch' : 'pointer');

    await expect(page.getByText('Contacts: 0 · peak: 0 · cancellations: 0')).toBeVisible();
  });
}

test('enabled audio produces a nonzero signal and releases to silence', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop'), 'Mobile audio activation.');

  await page.addInitScript(() => {
    const Native = window.AudioContext;

    window.AudioContext = class extends Native {
      createGain() {
        const gain = super.createGain();

        if (!(window as unknown as { signal?: AnalyserNode }).signal) {
          const analyser = this.createAnalyser();

          analyser.fftSize = 256;
          gain.connect(analyser);
          Object.assign(window, { signal: analyser });
        }

        return gain;
      }
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).tap();
  await expect(page.locator('canvas')).toBeVisible();
  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Keyboard missing');
  const layout = makeLayout(box.width, box.height, diameterForRows(box.height), false, {
    edo: 7,
    a: 1,
    b: 4,
    register: 0,
  });
  const key = layout.keys[Math.floor(layout.keys.length / 2)];

  const rms = () =>
    page.evaluate(() => {
      const analyser = (window as unknown as { signal: AnalyserNode }).signal;
      const samples = new Float32Array(analyser.fftSize);

      analyser.getFloatTimeDomainData(samples);

      return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    });

  // A mouse pointer exercises the same voice sink in WebKit's mobile emulation.
  await page.mouse.move(box.x + key.x, box.y + key.y);
  await page.mouse.down();
  await expect.poll(rms).toBeGreaterThan(0.001);
  await page.mouse.up();
  await expect.poll(rms).toBeLessThan(0.00001);
});
