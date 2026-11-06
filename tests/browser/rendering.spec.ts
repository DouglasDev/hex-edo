import { test, expect } from './fixtures';
import { makeLayout } from '../../src/instrument/layout';
import { diameterForRows, keySizeLabel } from '../../src/instrument/keySize';

test('pixel size readout follows auto sizing, manual changes, and saved settings', async ({
  page,
}, testInfo) => {
  const mobile = !testInfo.project.name.startsWith('desktop');

  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const initial = mobile ? diameterForRows(page.viewportSize()!.height) : 76;

  await expect(page.locator('#key-size-readout')).toHaveText(keySizeLabel(initial));
  if (mobile)
    await expect(page.getByRole('button', { name: 'Fit 5 rows' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  await page.getByLabel('Key size', { exact: true }).focus();
  await page.getByLabel('Key size', { exact: true }).press('ArrowRight');
  const fixedSize = Number(await page.getByLabel('Key size', { exact: true }).inputValue());

  await expect(page.locator('#key-size-readout')).toHaveText(keySizeLabel(fixedSize));
  if (mobile)
    await expect(page.getByRole('button', { name: 'Fit 5 rows' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.locator('#key-size-readout')).toHaveText(keySizeLabel(fixedSize));

  if (mobile) {
    await page.getByRole('button', { name: 'Fit 5 rows' }).click();
    await expect(page.locator('#key-size-readout')).toHaveText(keySizeLabel(initial));
  }

  await expect(page.getByText('Root (degree 1): C4 · 261.626 Hz')).toBeVisible();
});

test('desktop pressed key brightens outside the old circular indicator and restores on release', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Desktop key highlight.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable audio' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  const box = await page.getByTestId('keyboard').boundingBox();

  if (!box) throw new Error('Missing keyboard');
  const layout = makeLayout(box.width, box.height, 76, true, { edo: 7, a: 1, b: 4, register: 0 });
  const key = layout.keys.find((key) => key.shortcut === 'g')!;
  const clip = {
    x: Math.round(box.x + key.x + 24),
    y: Math.round(box.y + key.y - 3),
    width: 4,
    height: 6,
  };
  const initial = await page.screenshot({ clip });

  await page.keyboard.down('g');
  await expect.poll(async () => (await page.screenshot({ clip })).equals(initial)).toBe(false);
  await page.keyboard.up('g');
  await expect.poll(async () => (await page.screenshot({ clip })).equals(initial)).toBe(true);
});
