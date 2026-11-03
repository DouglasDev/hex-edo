import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Performance } from '../src/instrument/Performance.ts';
import { makeLayout } from '../src/instrument/layout.ts';

function setup() {
  const voices = new Map();
  const released = [];
  const sink = {
    start(id, step) {
      voices.set(id, step);

      return true;
    },
    bend(id, step) {
      voices.set(id, step);
    },
    release(id) {
      voices.delete(id);
      released.push(id);
    },
  };
  const layout = makeLayout(820, 300, 76, false, { edo: 7, a: 1, b: 4, register: 0 });

  return { player: new Performance(sink, layout, 'triangle'), layout, voices, released };
}

test('independent touches on the same pitch survive individual release', () => {
  const { player, layout, voices } = setup();
  const key = layout.keys[0];

  player.down('one', key.x, key.y);
  player.down('two', key.x, key.y);
  assert.equal(voices.size, 2);
  player.up('one');
  assert.equal(voices.size, 1);
  assert.equal(voices.get('two'), key.step);
});

test('attack is quantized, jitter is ignored, and slides reach exact centers', () => {
  const { player, layout, voices } = setup();
  const [left, right] = layout.keys;

  player.down('one', left.x + 6, left.y);
  assert.equal(voices.get('one'), left.step);
  player.move('one', left.x + 7, left.y);
  assert.equal(voices.get('one'), left.step);
  player.move('one', (left.x + right.x) / 2, left.y);
  assert.ok(Math.abs(voices.get('one') - (left.step + right.step) / 2) < 1e-10);
  player.move('one', right.x, right.y);
  assert.ok(Math.abs(voices.get('one') - right.step) < 1e-10);
  player.up('one');
  assert.equal(voices.size, 0);
});

test('each finger bends independently, holds intermediate pitch, and all notes clean up', () => {
  const { player, layout, voices, released } = setup();
  const [left, right] = layout.keys;

  player.down('one', left.x, left.y);
  player.down('two', right.x, right.y);
  player.move('one', left.x + (right.x - left.x) * 0.3, left.y);
  assert.ok(Math.abs(voices.get('one') - (left.step + 0.3)) < 1e-10);
  assert.equal(voices.get('two'), right.step);
  assert.equal(voices.size, 2);
  player.releaseAll();
  assert.equal(voices.size, 0);
  assert.equal(player.held.size, 0);
  assert.deepEqual(released, ['one', 'two']);
});

test('out-of-board touches and unsuccessful starts never create held voices', () => {
  const { player } = setup();

  player.down('one', -500, -500);
  assert.equal(player.held.size, 0);
  const layout = makeLayout(820, 300, 76, false, { edo: 7, a: 1, b: 4, register: 0 });
  const blocked = new Performance({ start: () => false, bend() {}, release() {} }, layout, 'sine');

  blocked.down('one', layout.keys[0].x, layout.keys[0].y);
  assert.equal(blocked.held.size, 0);
});
