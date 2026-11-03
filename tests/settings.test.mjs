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
  storage.set('hex-edo.settings.v3', '{broken');
  assert.deepEqual(readSettings(), DEFAULTS);
});

test('five-row default migrates old defaults while preserving manually sized keys', () => {
  const storage = new Map();

  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  assert.equal(readSettings().sizeMode, 'rows');
  storage.set('hex-edo.settings.v2', JSON.stringify({ ...DEFAULTS, size: 76, volume: 0.42 }));
  assert.equal(readSettings().sizeMode, 'rows');
  assert.equal(readSettings().volume, 0.42);
  storage.set('hex-edo.settings.v2', JSON.stringify({ ...DEFAULTS, size: 104 }));
  assert.equal(readSettings().sizeMode, 'pixels');
  assert.equal(readSettings().size, 104);
  saveSettings({ ...DEFAULTS, size: 160, sizeMode: 'pixels' });
  assert.equal(readSettings().size, 160);
  assert.equal(readSettings().sizeMode, 'pixels');
});
