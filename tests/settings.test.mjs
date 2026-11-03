import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULTS, readSettings, saveSettings } from '../src/instrument/settings.ts';

test('new and legacy-default settings start at doubled volume', () => {
  const storage = new Map();

  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  assert.equal(readSettings().volume, 0.6);
  storage.set('hex-edo.settings.v1', JSON.stringify({ ...DEFAULTS, volume: 0.3 }));
  assert.equal(readSettings().volume, 0.6);
  storage.set('hex-edo.settings.v1', JSON.stringify({ ...DEFAULTS, volume: 0 }));
  assert.equal(readSettings().volume, 0);
  saveSettings({ ...DEFAULTS, volume: 0.3 });
  assert.equal(readSettings().volume, 0.3);
  storage.set('hex-edo.settings.v2', '{broken');
  assert.deepEqual(readSettings(), DEFAULTS);
});
