import { fieldStep, keyAt, type Layout, type KeyCell } from './layout';
import type { Timbre } from './settings';

export interface VoiceSink {
  start(id: string, step: number, edo: number, timbre: Timbre): boolean;
  bend(id: string, step: number, edo: number): void;
  release(id: string): void;
}

interface Finger {
  x: number;
  y: number;
  moving: boolean;
}

export class Performance {
  private fingers = new Map<string, Finger>();
  readonly held = new Map<string, { x: number; y: number; key: KeyCell }>();
  private sink: VoiceSink;
  private layout: Layout;
  private timbre: Timbre;

  constructor(sink: VoiceSink, layout: Layout, timbre: Timbre) {
    this.sink = sink;
    this.layout = layout;
    this.timbre = timbre;
  }

  down(id: string, x: number, y: number) {
    if (this.held.has(id)) return;
    const key = keyAt(x, y, this.layout);

    if (!key || !this.sink.start(id, key.step, this.layout.mapping.edo, this.timbre)) return;
    this.fingers.set(id, { x, y, moving: false });
    this.held.set(id, { x: key.x, y: key.y, key });
  }

  move(id: string, x: number, y: number) {
    const finger = this.fingers.get(id);

    if (!finger) return;
    if (!finger.moving && Math.hypot(x - finger.x, y - finger.y) < 3) return;
    finger.moving = true;
    const step = fieldStep(x, y, this.layout);
    const key = keyAt(x, y, this.layout) ?? this.held.get(id)!.key;

    this.sink.bend(id, step, this.layout.mapping.edo);
    this.held.set(id, { x, y, key });
  }

  up(id: string) {
    this.sink.release(id);
    this.fingers.delete(id);
    this.held.delete(id);
  }

  releaseAll() {
    for (const id of [...this.held.keys()]) this.up(id);
  }
}
