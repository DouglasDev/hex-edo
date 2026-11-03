import { stepAt, type Mapping } from './tuning';

export interface KeyCell {
  q: number;
  r: number;
  x: number;
  y: number;
  step: number;
  shortcut?: string;
}

export interface Layout {
  keys: KeyCell[];
  radius: number;
  offsetX: number;
  offsetY: number;
  origin: number;
  mapping: Mapping;
}

export const SHORTCUTS = '1234567890qwertyuiopasdfghjklzxcvbnm';

export function makeLayout(
  width: number,
  height: number,
  diameter: number,
  desktop: boolean,
  mapping: Mapping,
): Layout {
  const radius = diameter / 2;
  const keyWidth = Math.sqrt(3) * radius;
  const rows = Math.max(
    0,
    Math.min(desktop ? 4 : 5, Math.floor((height - 20 - radius / 2) / (1.5 * radius))),
  );
  const columns = Math.max(
    0,
    Math.min(9, Math.floor((width - 24) / keyWidth - (rows > 1 ? 0.5 : 0))),
  );
  const offsetX = (width - (columns + (rows > 1 ? 0.5 : 0)) * keyWidth) / 2 + keyWidth / 2;
  const offsetY = (height - ((rows - 1) * 1.5 * radius + 2 * radius)) / 2 + radius;
  const middleR = Math.floor(rows / 2);
  const middleQ = Math.floor(columns / 2) - Math.floor(middleR / 2);
  const origin = -mapping.a * middleQ - mapping.b * middleR;
  const keys: KeyCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const q = column - Math.floor(row / 2);
      const r = row;

      keys.push({
        q,
        r,
        x: offsetX + keyWidth * (q + r / 2),
        y: offsetY + 1.5 * radius * r,
        step: stepAt(q, r, origin, mapping),
        shortcut: desktop ? SHORTCUTS[keys.length] : undefined,
      });
    }
  }

  return { keys, radius, offsetX, offsetY, origin, mapping };
}

export function fieldStep(x: number, y: number, layout: Layout): number {
  const r = (y - layout.offsetY) / (1.5 * layout.radius);
  const q = (x - layout.offsetX) / (Math.sqrt(3) * layout.radius) - r / 2;

  return stepAt(q, r, layout.origin, layout.mapping);
}

export function keyAt(x: number, y: number, layout: Layout): KeyCell | undefined {
  return layout.keys.find((key) => {
    const dx = Math.abs(x - key.x);
    const dy = Math.abs(y - key.y);
    const radius = layout.radius;

    return dx <= (Math.sqrt(3) * radius) / 2 && dy <= radius && dy + dx / Math.sqrt(3) <= radius;
  });
}
