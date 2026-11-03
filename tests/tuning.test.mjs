import assert from 'node:assert/strict';
import { test } from 'node:test';
import { frequency, mod, noteLabel, stepAt, validMapping } from '../src/instrument/tuning.ts';
import {
  makeLayout,
  fieldStep,
  keyAt,
  SHORTCUTS,
  SHORTCUT_ROWS,
} from '../src/instrument/layout.ts';

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
  assert.equal(noteLabel(-1, 7), '7 · 3');
  assert.equal(noteLabel(0, 7), '1 · 4');
  assert.equal(noteLabel(7, 7), '1 · 5');
});

test('desktop shortcuts are unique and mobile has no shortcut labels', () => {
  const mapping = { edo: 7, a: 1, b: 4, register: 0 };
  const desktop = makeLayout(1400, 700, 76, true, mapping);
  const mobile = makeLayout(1400, 700, 76, false, mapping);

  assert.equal(SHORTCUTS.length, 36);
  assert.equal(desktop.keys.length, 36);
  assert.equal(new Set(desktop.keys.map((key) => key.shortcut)).size, 36);
  assert.ok(mobile.keys.length > 45);
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

test('desktop number and letter rows never wrap when resized', () => {
  const mapping = { edo: 7, a: 1, b: 4, register: 0 };

  for (const width of [390, 520, 820, 1400]) {
    for (const size of [48, 76, 112]) {
      const layout = makeLayout(width, 700, size, true, mapping);

      for (const [r, shortcuts] of SHORTCUT_ROWS.entries()) {
        const row = layout.keys.filter((key) => key.r === r);

        assert.equal(row.map((key) => key.shortcut).join(''), shortcuts.slice(0, row.length));

        for (const [index, key] of row.entries()) {
          assert.ok(Math.abs(fieldStep(key.x, key.y, layout) - key.step) < 1e-10);
          if (index > 0) assert.ok(key.x > row[index - 1].x);
        }
      }

      const zero = layout.keys.find((key) => key.shortcut === '0');

      if (zero) {
        assert.equal(zero.r, 0);
        assert.ok(zero.x > layout.keys.find((key) => key.shortcut === '9').x);
      }
    }
  }
});

test('mobile uses the full viewport without the previous row and column caps', () => {
  const layout = makeLayout(844, 390, 76, false, { edo: 7, a: 1, b: 4, register: 0 });

  assert.equal(new Set(layout.keys.map((key) => key.r)).size, 6);
  assert.ok(layout.keys.filter((key) => key.r === 0).length >= 12);
  assert.ok(layout.keys.length >= 72);
  assert.ok(Math.min(...layout.keys.map((key) => key.y - layout.radius)) < layout.radius);
});
