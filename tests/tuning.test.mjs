import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frequency, mod, noteLabel, stepAt, validMapping } from '../src/instrument/tuning.ts';
import { makeLayout, fieldStep, keyAt, SHORTCUTS } from '../src/instrument/layout.ts';

for (let edo = 2; edo <= 9; edo++) {
  test(`${edo} EDO: octaves, coverage, translation and pitch field`, () => {
    const mapping = { edo, a: 1, b: Math.ceil(edo / 2), register: 0 };
    const layout = makeLayout(820, 300, 76, false, mapping);
    const classes = new Set(layout.keys.map((key) => mod(key.step, edo)));

    assert.equal(classes.size, edo);
    assert.ok(validMapping(mapping.a, mapping.b, edo));

    for (const key of layout.keys) {
      assert.ok(Math.abs(frequency(key.step + edo, edo) / frequency(key.step, edo) - 2) < 1e-10);
      assert.ok(Math.abs(fieldStep(key.x, key.y, layout) - key.step) < 1e-10);
      assert.equal(keyAt(key.x, key.y, layout), key);

      assert.equal(
        stepAt(key.q + 2, key.r - 1, layout.origin, mapping) - key.step,
        2 * mapping.a - mapping.b,
      );

      assert.ok(key.x - (Math.sqrt(3) * layout.radius) / 2 >= 0);
      assert.ok(key.y - layout.radius >= 0);
      assert.ok(key.x + (Math.sqrt(3) * layout.radius) / 2 <= 820);
      assert.ok(key.y + layout.radius <= 300);
    }

    const [left, right] = layout.keys;
    const midpoint = fieldStep((left.x + right.x) / 2, (left.y + right.y) / 2, layout);

    assert.ok(Math.abs(midpoint - (left.step + right.step) / 2) < 1e-10);
  });
}

test('invalid mappings and negative octave labels', () => {
  assert.equal(validMapping(2, 4, 6), false);
  assert.equal(validMapping(0, 0, 7), false);
  assert.equal(validMapping(0.5, 1, 7), false);
  assert.equal(validMapping(-2, 3, 6), true);
  assert.equal(noteLabel(-1, 7), '6 · 3');
  assert.equal(noteLabel(0, 7), '0 · 4');
  assert.equal(noteLabel(7, 7), '0 · 5');
});

test('desktop shortcuts are unique and mobile has no shortcut labels', () => {
  const mapping = { edo: 7, a: 1, b: 4, register: 0 };
  const desktop = makeLayout(1400, 700, 76, true, mapping);
  const mobile = makeLayout(1400, 700, 76, false, mapping);

  assert.equal(SHORTCUTS.length, 36);
  assert.equal(desktop.keys.length, 36);
  assert.equal(new Set(desktop.keys.map((key) => key.shortcut)).size, 36);
  assert.equal(mobile.keys.length, 45);
  assert.ok(mobile.keys.every((key) => key.shortcut === undefined));
});

test('small screens contain whole keys and shrink key count', () => {
  const mapping = { edo: 2, a: 1, b: 1, register: 0 };
  const layout = makeLayout(520, 190, 76, false, mapping);

  assert.ok(layout.keys.length < 45);
  assert.ok(layout.keys.length > 0);

  for (const key of layout.keys) {
    assert.ok(key.y - layout.radius >= 0);
    assert.ok(key.y + layout.radius <= 190);
    assert.ok(key.x - (Math.sqrt(3) * layout.radius) / 2 >= 0);
    assert.ok(key.x + (Math.sqrt(3) * layout.radius) / 2 <= 520);
  }

  assert.equal(makeLayout(20, 20, 76, false, mapping).keys.length, 0);
});
