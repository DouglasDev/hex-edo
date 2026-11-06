import { test, expect } from './fixtures';
import { installProbe, type Audit } from './audioProbe';
import { makeLayout } from '../../src/instrument/layout';

test('audio activation, all EDO choices, settings validation and persistence', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enable audio' })).toBeVisible();
  await page.getByRole('button', { name: 'Enable audio' }).click();
  await expect(page.getByRole('button', { name: 'Enable audio' })).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();

  for (let edo = 2; edo <= 9; edo++) {
    if (!testInfo.project.name.startsWith('desktop'))
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('EDO tuning').selectOption(String(edo));
    if (testInfo.project.name.startsWith('desktop')) {
      await expect(page.getByLabel('EDO tuning')).toHaveValue(String(edo));
      await expect(page.getByLabel('EDO tuning')).not.toBeFocused();
    } else
      await expect(page.getByRole('button', { name: 'Settings', exact: true })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
  }

  if (!testInfo.project.name.startsWith('desktop'))
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('EDO tuning').selectOption('6');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Right axis steps', { exact: true }).fill('2');
  await page.getByLabel('Down-right axis steps').fill('4');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply mapping' })).toBeDisabled();
  await page.getByLabel('Down-right axis steps').fill('3');
  await page.getByRole('button', { name: 'Apply mapping' }).click();
  await page.getByLabel('Timbre').selectOption('sine');
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Right axis steps', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Down-right axis steps')).toHaveValue('3');
  await expect(page.getByLabel('Timbre')).toHaveValue('sine');
  await expect(page.getByTestId('commit')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('portrait blocks mobile play and landscape restores the keyboard', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.setViewportSize({ width: 390, height: 844 });
  // WebKit's mobile viewport override changes dimensions without emitting native resize.
  if (testInfo.project.name === 'iphone-webkit')
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

  if (testInfo.project.name.startsWith('desktop')) {
    await expect(page.getByTestId('keyboard')).toBeVisible();
    await expect(page.getByText('Rotate your phone')).toHaveCount(0);
  } else {
    await expect(page.getByRole('button', { name: 'Start playing' })).toBeVisible();
    await expect(page.getByTestId('keyboard')).toHaveCount(0);
    await page.setViewportSize({ width: 844, height: 390 });
    if (testInfo.project.name === 'iphone-webkit')
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await expect(page.getByTestId('keyboard')).toBeVisible();
  }
});

test('audio receives independent desktop shortcuts and pointer cleanup', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Physical key path is desktop only.');

  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    const audit: { frequency: number; stopped: boolean }[] = [];

    Object.assign(window, { audioAudit: audit });

    window.AudioContext = class extends NativeAudioContext {
      createOscillator() {
        const oscillator = super.createOscillator();
        const stop = oscillator.stop.bind(oscillator);
        const entry = { frequency: 0, stopped: false };

        audit.push(entry);

        oscillator.stop = (when?: number) => {
          entry.frequency = oscillator.frequency.value;
          entry.stopped = true;
          stop(when);
        };

        return oscillator;
      }
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).click();
  await expect(page.getByRole('status')).toHaveText('Audio on');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByLabel('EDO tuning').selectOption('9');
  await expect(page.getByLabel('EDO tuning')).not.toBeFocused();
  await page.keyboard.down('1');
  await page.keyboard.down('2');
  await page.keyboard.up('1');

  const audit = () =>
    page.evaluate(() => (window as unknown as { audioAudit: { stopped: boolean }[] }).audioAudit);

  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(1);
  await page.keyboard.up('2');
  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(0);
  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Missing keyboard');
  const key = makeLayout(box.width, box.height, 76, true, { edo: 9, a: 1, b: 5, register: 0 })
    .keys[15];

  await page.mouse.move(box.x + key.x, box.y + key.y);
  await page.mouse.down();
  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(1);
  await page.mouse.move(box.x + key.x + 40, box.y + key.y);
  await page.mouse.up();
  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(0);
  await page.keyboard.down('a');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(0);
  await page.keyboard.up('a');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.keyboard.down('b');
  await expect.poll(async () => (await audit()).filter((voice) => !voice.stopped).length).toBe(1);
  await page.keyboard.up('b');
});

test('keyup releases before a focused page element stops bubbling, without cancelAndHoldAtTime', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Desktop key release.');

  await page.addInitScript(() => {
    Object.defineProperty(AudioParam.prototype, 'cancelAndHoldAtTime', {
      configurable: true,
      value: undefined,
    });

    document.addEventListener('keyup', (event) => event.stopPropagation());
  });

  await installProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).click();
  await expect(page.locator('canvas')).toBeVisible();

  const active = () =>
    page.evaluate(
      () =>
        (window as unknown as { synthAudit: Audit }).synthAudit.voices.filter((v) => !v.stopped)
          .length,
    );

  // Give the rendering scene its first frame before sending the first key.
  await expect
    .poll(async () => {
      await page.keyboard.press('a');

      return page.evaluate(
        () => (window as unknown as { synthAudit: Audit }).synthAudit.voices.length,
      );
    })
    .toBeGreaterThan(0);

  await expect.poll(active).toBe(0);
  await page.keyboard.down('a');
  await page.keyboard.down('s');
  await expect.poll(active).toBe(2);
  await page.keyboard.up('a');
  await expect.poll(active).toBe(1);
  await page.keyboard.up('s');
  await expect.poll(active).toBe(0);
  await page.keyboard.down('d');
  await expect.poll(active).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(active).toBe(0);
  await page.keyboard.up('d');
});
