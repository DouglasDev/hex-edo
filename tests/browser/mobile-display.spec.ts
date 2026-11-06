import { test, expect } from './fixtures';
import { installProbe, type Audit } from './audioProbe';

async function mockDisplay(page: import('@playwright/test').Page, supported = true) {
  await page.addInitScript(
    ({ supported }) => {
      const requests: string[] = [];
      let fullscreen: Element | null = null;

      Object.assign(window, { displayRequests: requests });
      Object.defineProperty(document, 'fullscreenEnabled', { get: () => supported });
      Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreen });

      Element.prototype.requestFullscreen = async function () {
        requests.push('fullscreen');
        if (!supported) throw new Error('Fullscreen unavailable');
        fullscreen = document.documentElement;
        document.dispatchEvent(new Event('fullscreenchange'));
      };

      document.exitFullscreen = async () => {
        requests.push('exit');
        fullscreen = null;
        document.dispatchEvent(new Event('fullscreenchange'));
      };

      Object.defineProperty(screen, 'orientation', {
        configurable: true,
        value: {
          lock: async (value: string) => {
            requests.push(value);
          },
          unlock: () => {
            requests.push('unlock');
          },
        },
      });
    },
    { supported },
  );
}

test('one portrait tap starts audio, requests fullscreen, then locks landscape', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop'), 'Mobile start gesture.');
  await installProbe(page);
  await mockDisplay(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).tap();

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { displayRequests: string[] }).displayRequests),
    )
    .toEqual(['fullscreen', 'landscape']);

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
    )
    .toBe('running');

  await page.setViewportSize({ width: 844, height: 390 });
  if (testInfo.project.name === 'iphone-webkit')
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect(page.getByTestId('keyboard')).toBeVisible();
  await page.getByRole('button', { name: 'Minimize fullscreen' }).tap();
  await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { displayRequests: string[] }).displayRequests.filter(
            (request) => request === 'fullscreen',
          ).length,
      ),
    )
    .toBe(1);

  await page.getByRole('button', { name: 'Enter fullscreen' }).tap();
  await expect(page.getByRole('button', { name: 'Minimize fullscreen' })).toBeVisible();
});

test('unsupported fullscreen leaves a working manual landscape fallback', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop'), 'Mobile fallback.');
  await installProbe(page);
  await mockDisplay(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).tap();
  await expect(page.getByText('Rotate your phone')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  if (testInfo.project.name === 'iphone-webkit')
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect(page.getByTestId('keyboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeDisabled();

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { synthAudit: Audit }).synthAudit.context.state),
    )
    .toBe('running');
});

test('mobile keyboard fills the viewport and tuning selection dismisses its overlay', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('desktop'), 'Mobile edge-to-edge layout.');
  await page.goto('/');
  const box = await page.getByTestId('keyboard').boundingBox();
  const viewport = page.viewportSize();

  expect(box).toEqual({ x: 0, y: 0, width: viewport!.width, height: viewport!.height });
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await page.getByLabel('EDO tuning').selectOption('8');

  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await expect(page.getByLabel('EDO tuning')).toHaveCount(0);
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByLabel('EDO tuning')).toHaveValue('8');
  await expect(page.getByLabel('Volume')).toHaveValue('0.6');
});
