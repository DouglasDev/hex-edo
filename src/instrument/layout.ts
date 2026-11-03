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

export const SHORTCUT_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export const SHORTCUTS = SHORTCUT_ROWS.join('');

export function makeLayout(
  width: number,
  height: number,
  diameter: number,
  desktop: boolean,
  mapping: Mapping,
): Layout {
  const radius = diameter / 2;
  const keyWidth = Math.sqrt(3) * radius;
  const paddingX = desktop ? 24 : 0;
  const paddingY = desktop ? 20 : 0;
  const rows = Math.max(
    0,
    Math.min(desktop ? 4 : Infinity, Math.floor((height - paddingY - radius / 2) / (1.5 * radius))),
  );

  const rowOffset = (row: number) => (desktop ? row / 2 : (row % 2) / 2);

  const columns = Array.from({ length: rows }, (_, row) =>
    Math.max(
      0,
      Math.min(
        desktop ? SHORTCUT_ROWS[row].length : Infinity,
        Math.floor((width - paddingX) / keyWidth - rowOffset(row)),
      ),
    ),
  );
  const boardWidth = Math.max(
    0,
    ...columns.map((count, row) => (count ? (count + rowOffset(row)) * keyWidth : 0)),
  );
  const offsetX = (width - boardWidth) / 2 + keyWidth / 2;
  const offsetY = (height - ((rows - 1) * 1.5 * radius + 2 * radius)) / 2 + radius;
  const middleR = Math.floor(rows / 2);
  const middleQ = Math.floor((columns[middleR] ?? 0) / 2) - (desktop ? 0 : Math.floor(middleR / 2));
  const origin = -mapping.a * middleQ - mapping.b * middleR;
  const keys: KeyCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns[row]; column++) {
      const q = column - (desktop ? 0 : Math.floor(row / 2));
      const r = row;

      keys.push({
        q,
        r,
        x: offsetX + keyWidth * (q + r / 2),
        y: offsetY + 1.5 * radius * r,
        step: stepAt(q, r, origin, mapping),
        shortcut: desktop ? SHORTCUT_ROWS[row][column] : undefined,
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
