import * as Phaser from 'phaser';
import { makeLayout, type Layout } from '../instrument/layout';
import { diameterForRows } from '../instrument/keySize';
import type { Settings } from '../instrument/settings';
import type { Performance } from '../instrument/Performance';
import { keyId, paintKeyboard } from './paintKeyboard';

export class KeyboardScene extends Phaser.Scene {
  layout?: Layout;
  performance?: Performance;
  private options: Settings;
  private desktop: boolean;
  private board?: Phaser.GameObjects.Image;
  private texture?: Phaser.Textures.CanvasTexture;
  private active?: Phaser.GameObjects.Graphics;
  private pressed = '';

  constructor(options: Settings, desktop: boolean) {
    super('keyboard');
    this.options = options;
    this.desktop = desktop;
  }

  create() {
    this.texture = this.textures.createCanvas('keyboard-board', 1, 1)!;
    this.board = this.add.image(0, 0, 'keyboard-board').setOrigin(0);
    this.active = this.add.graphics();
    this.resize(this.scale.width, this.scale.height);

    void document.fonts.ready.then(() => {
      if (this.sys?.isActive()) this.paint();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.texture?.destroy();
      this.texture = undefined;
    });
  }

  resize(width: number, height: number) {
    if (!this.texture || !this.board || width < 1 || height < 1) return;
    this.performance?.releaseAll();
    const size =
      !this.desktop && this.options.sizeMode === 'rows'
        ? diameterForRows(height)
        : this.options.size;

    this.layout = makeLayout(width, height, size, this.desktop, this.options);
    this.texture.setSize(width, height);
    this.board.setDisplaySize(width, height);
    this.pressed = '';
    this.paint();
  }

  private paint(active?: Set<string>) {
    if (!this.texture || !this.layout) return;
    const keys =
      active ??
      new Set([...(this.performance?.held.values() ?? [])].map((finger) => keyId(finger.key)));

    paintKeyboard(this.texture.context, this.layout, this.desktop, keys);
    this.texture.refresh();
  }

  update() {
    if (!this.active) return;
    const held = [...(this.performance?.held.values() ?? [])];
    const keys = new Set(held.map((finger) => keyId(finger.key)));
    const signature = [...keys].sort().join('|');

    if (signature !== this.pressed) {
      this.pressed = signature;
      this.paint(keys);
    }

    this.active.clear();

    if (!this.desktop) {
      for (const finger of held) {
        this.active.lineStyle(2, 0xd3ffe1, 0.8).strokeCircle(finger.x, finger.y, 14);
        this.active.fillStyle(0xe2ffeb, 0.16).fillCircle(finger.x, finger.y, 20);
      }
    }
  }
}
