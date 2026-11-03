import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Synth } from '../src/audio/Synth.ts';
import { frequency } from '../src/instrument/tuning.ts';

class Param {
  value = 0;

  setValueAtTime(value) {
    this.value = value;
  }

  linearRampToValueAtTime(value) {
    this.value = value;
  }

  setTargetAtTime(value) {
    this.value = value;
  }

  cancelAndHoldAtTime() {}
}

class Node {
  gain = new Param();
  frequency = new Param();
  Q = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  connected = false;
  stopped = false;

  connect() {
    this.connected = true;
  }

  disconnect() {
    this.connected = false;
  }

  start() {}

  stop() {
    this.stopped = true;
  }
}

class Context {
  static latest;
  state = 'suspended';
  currentTime = 0;
  destination = new Node();
  oscillators = [];

  constructor() {
    Context.latest = this;
  }

  createGain() {
    return new Node();
  }

  createDynamicsCompressor() {
    return new Node();
  }

  createBiquadFilter() {
    return new Node();
  }

  createOscillator() {
    const node = new Node();

    this.oscillators.push(node);

    return node;
  }

  async resume() {
    this.state = 'running';
    this.onstatechange?.();
  }

  async close() {
    this.state = 'closed';
  }
}

test('synth activates, bends separate oscillator voices and recovers from interruption', async () => {
  globalThis.AudioContext = Context;
  const synth = new Synth();
  const statuses = [];

  synth.onStatus = (status) => statuses.push(status);
  assert.equal(synth.start('one', 0, 7, 'triangle'), false);
  await synth.enable();
  assert.equal(statuses.at(-1), 'ready');
  assert.equal(synth.start('one', 0, 7, 'triangle'), true);
  assert.equal(synth.start('two', 0, 7, 'sawtooth'), true);
  assert.equal(synth.voiceCount, 2);
  synth.bend('one', 0.5, 7);
  assert.equal(Context.latest.oscillators[0].frequency.value, frequency(0.5, 7));
  assert.equal(Context.latest.oscillators[1].frequency.value, frequency(0, 7));
  synth.release('one');
  assert.equal(synth.voiceCount, 1);
  assert.equal(Context.latest.oscillators[0].stopped, true);
  Context.latest.oscillators[0].onended();
  assert.equal(Context.latest.oscillators[0].connected, false);
  Context.latest.state = 'interrupted';
  Context.latest.onstatechange();
  assert.equal(synth.voiceCount, 0);
  assert.equal(Context.latest.oscillators[1].stopped, true);
  assert.equal(statuses.at(-1), 'suspended');
  await synth.enable();
  assert.equal(statuses.at(-1), 'ready');
  synth.dispose();
  assert.equal(Context.latest.state, 'closed');
});
