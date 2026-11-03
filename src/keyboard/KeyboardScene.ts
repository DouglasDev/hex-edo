import * as Phaser from 'phaser';
import { makeLayout, type Layout } from '../instrument/layout';
import { mod, noteLabel } from '../instrument/tuning';
import type { Settings } from '../instrument/settings';
import type { Performance } from '../instrument/Performance';

export class KeyboardScene extends Phaser.Scene {
  layout?: Layout;
  performance?: Performance;
  private options: Settings;
  private desktop: boolean;
  private ink?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private active?: Phaser.GameObjects.Graphics;

  constructor(options: Settings, desktop: boolean) {
    super('keyboard');
    this.options = options;
    this.desktop = desktop;
  }

  create() {
    this.ink = this.add.graphics();
    this.active = this.add.graphics();
    this.resize(this.scale.width, this.scale.height);
  }

  resize(width: number, height: number) {
    if (!this.ink) return;
    this.performance?.releaseAll();
    this.layout = makeLayout(width, height, this.options.size, this.desktop, this.options);
    this.ink.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];

    for (const key of this.layout.keys) {
      const degree = mod(key.step, this.options.edo);
      const root = degree === 0;
      const hue = degree / this.options.edo;
      const fill = Phaser.Display.Color.HSLToColor(hue, root ? 0.32 : 0.25, root ? 0.3 : 0.2).color;
      const edge = Phaser.Display.Color.HSLToColor(hue, 0.35, root ? 0.63 : 0.34).color;
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = ((60 * i - 30) * Math.PI) / 180;

        return new Phaser.Math.Vector2(
          key.x + (this.layout!.radius - 3) * Math.cos(angle),
          key.y + (this.layout!.radius - 3) * Math.sin(angle),
        );
      });

      this.ink.fillStyle(fill, 1).fillPoints(points, true);
      this.ink.lineStyle(root ? 1.7 : 1, edge, 1).strokePoints(points, true);

      this.labels.push(
        this.add
          .text(key.x, key.y - (this.desktop ? 8 : 3), String(degree), {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: `${Math.max(15, this.options.size * 0.24)}px`,
            color: root ? '#d8ffe7' : '#f1f4f8',
            fontStyle: root ? 'bold' : 'normal',
          })
          .setOrigin(0.5),
      );

      this.labels.push(
        this.add
          .text(
            key.x,
            key.y + (this.desktop ? 11 : 15),
            this.desktop
              ? `${noteLabel(key.step, this.options.edo).split(' · ')[1]} · ${key.shortcut!.toUpperCase()}`
              : `oct ${noteLabel(key.step, this.options.edo).split(' · ')[1]}`,
            {
              fontFamily: 'DM Mono, monospace',
              fontSize: `${Math.max(9, this.options.size * 0.13)}px`,
              color: '#b4bec9',
            },
          )
          .setOrigin(0.5),
      );

      if (root)
        this.ink.fillStyle(0xbbf4ce, 1).fillCircle(key.x, key.y - this.layout.radius + 10, 2);
    }
  }

  update() {
    if (!this.active) return;
    this.active.clear();

    for (const finger of this.performance?.held.values() ?? []) {
      this.active.lineStyle(2, 0xd3ffe1, 0.8).strokeCircle(finger.x, finger.y, 14);
      this.active.fillStyle(0xe2ffeb, 0.16).fillCircle(finger.x, finger.y, 20);
    }
  }
}
