import { test, expect } from '@playwright/test';
import { diameterForRows } from '../../src/instrument/keySize';
import { makeLayout } from '../../src/instrument/layout';

import { installProbe, type Audit } from './audioProbe';

test('mobile touch activation and operating-system-style audio interruption', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chromium', 'Touch devices only.');
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

test('three fingers landing together start three voices and cancellation releases them', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'android-chromium', 'Native Chromium three-finger protocol.');
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
});
