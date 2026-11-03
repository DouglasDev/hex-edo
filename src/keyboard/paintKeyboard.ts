import type { Layout, KeyCell } from '../instrument/layout';
import { mod, noteLabel } from '../instrument/tuning';

export function keyId(key: KeyCell): string {
  return `${key.q}:${key.r}`;
}

/** Paint the key and its labels together, avoiding separate text textures. */
export function paintKeyboard(
  context: CanvasRenderingContext2D,
  layout: Layout,
  desktop: boolean,
  active: Set<string>,
) {
  const diameter = layout.radius * 2;

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#0d1119';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const key of layout.keys) {
    const pitchClass = mod(key.step, layout.mapping.edo);
    const root = pitchClass === 0;
    const pressed = active.has(keyId(key));
    const hue = (pitchClass / layout.mapping.edo) * 360;
    const lightness = pressed ? (root ? 46 : 37) : root ? 30 : 20;
    const radius = layout.radius - (desktop ? 3 : 1);

    context.beginPath();

    for (let i = 0; i < 6; i++) {
      const angle = ((60 * i - 30) * Math.PI) / 180;
      const x = key.x + radius * Math.cos(angle);
      const y = key.y + radius * Math.sin(angle);

      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.closePath();
    context.fillStyle = `hsl(${hue} ${root ? 32 : 25}% ${lightness}%)`;
    context.fill();
    context.strokeStyle = pressed ? '#d3ffe1' : `hsl(${hue} 35% ${root ? 63 : 34}%)`;
    context.lineWidth = pressed ? 2 : root ? 1.7 : 1;
    context.stroke();
    context.fillStyle = root ? '#d8ffe7' : '#f1f4f8';
    context.font = `${root ? 600 : 400} ${Math.max(15, diameter * 0.24)}px "DM Sans", sans-serif`;
    context.fillText(String(pitchClass + 1), key.x, key.y - diameter * 0.1);
    context.fillStyle = '#c3cdd9';
    context.font = `${Math.max(9, diameter * 0.13)}px "DM Mono", monospace`;
    const octave = noteLabel(key.step, layout.mapping.edo).split(' · ')[1];

    context.fillText(
      desktop ? `${octave} · ${key.shortcut!.toUpperCase()}` : `oct ${octave}`,
      key.x,
      key.y + diameter * 0.19,
    );

    if (root) {
      context.beginPath();
      context.arc(key.x, key.y - layout.radius + Math.max(6, diameter * 0.13), 2, 0, 2 * Math.PI);
      context.fillStyle = '#bbf4ce';
      context.fill();
    }
  }

  context.restore();
}
