import type { InputMonitor } from './InputMonitor';
import type { Performance } from '../instrument/Performance';

/** Touch Events expose every newly landed finger in a single changedTouches batch. */
export function bindTouchBatch(
  element: HTMLElement,
  player: () => Performance | undefined,
  monitor: InputMonitor,
): (() => void) | undefined {
  if (!('ontouchstart' in window)) return undefined;

  const handle = (phase: 'down' | 'move' | 'up') => (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
    const performance = player();
    const bounds = element.getBoundingClientRect();

    if (!performance) return;

    for (const touch of Array.from(event.changedTouches)) {
      const id = `touch:${touch.identifier}`;

      if (phase === 'up') {
        monitor.up(id, event.type === 'touchcancel');
        performance.up(id);
      } else {
        if (phase === 'down') monitor.down(id);
        performance[phase](id, touch.clientX - bounds.left, touch.clientY - bounds.top);
      }
    }
  };

  const start = handle('down');
  const move = handle('move');
  const end = handle('up');
  const options = { passive: false };

  element.addEventListener('touchstart', start, options);
  element.addEventListener('touchmove', move, options);
  element.addEventListener('touchend', end, options);
  element.addEventListener('touchcancel', end, options);

  return () => {
    element.removeEventListener('touchstart', start);
    element.removeEventListener('touchmove', move);
    element.removeEventListener('touchend', end);
    element.removeEventListener('touchcancel', end);
  };
}
