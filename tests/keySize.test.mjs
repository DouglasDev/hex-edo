import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diameterForRows, keySizeLabel } from '../src/instrument/keySize.ts';
import { makeLayout } from '../src/instrument/layout.ts';

test('mobile automatic sizing fits exactly five whole hex rows at phone heights', () => {
  for (const height of [240, 320, 375, 390, 412, 480, 540, 720]) {
    const diameter = diameterForRows(height);
    const layout = makeLayout(844, height, diameter, false, { edo: 7, a: 1, b: 4, register: 0 });

    assert.equal(new Set(layout.keys.map((key) => key.r)).size, 5);
    assert.equal(diameter, height / 4);

    assert.ok(
      layout.keys.every(
        (key) => key.y - layout.radius >= -1e-9 && key.y + layout.radius <= height + 1e-9,
      ),
    );
  }
});

test('size readout describes screen pixels rather than uncalibrated physical units', () => {
  assert.equal(keySizeLabel(100), '86.6 × 100 px (width × height)');
  assert.equal(keySizeLabel(76), '65.8 × 76 px (width × height)');
});
