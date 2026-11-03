import type { Synth } from '../audio/Synth';
import { Performance } from '../instrument/Performance';
import type { Timbre } from '../instrument/settings';
import type { KeyboardScene } from './KeyboardScene';

interface InputOptions {
  element: HTMLElement;
  scene: KeyboardScene;
  synth: Synth;
  timbre: Timbre;
  desktop: boolean;
  enabled: boolean;
}

export function bindInput({ element, scene, synth, timbre, desktop, enabled }: InputOptions) {
  const performance = () => {
    if (!scene.layout || !enabled) return undefined;
    if (!scene.performance) scene.performance = new Performance(synth, scene.layout, timbre);

    return scene.performance;
  };

  const coordinates = (event: PointerEvent) => {
    const bounds = element.getBoundingClientRect();

    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const down = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const point = coordinates(event);

    performance()?.down(`pointer:${event.pointerId}`, point.x, point.y);
    if (scene.performance?.held.has(`pointer:${event.pointerId}`))
      element.setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent) => {
    const point = coordinates(event);

    scene.performance?.move(`pointer:${event.pointerId}`, point.x, point.y);
  };

  const up = (event: PointerEvent) => {
    scene.performance?.up(`pointer:${event.pointerId}`);
  };

  const keyDown = (event: KeyboardEvent) => {
    if (
      !desktop ||
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      (event.target instanceof HTMLElement &&
        event.target.closest('input, select, textarea, summary'))
    )
      return;
    const shortcut = event.code.startsWith('Key')
      ? event.code.slice(3).toLowerCase()
      : event.code.startsWith('Digit')
        ? event.code.slice(5)
        : '';
    const key = scene.layout?.keys.find((cell) => cell.shortcut === shortcut);

    if (!key) return;
    event.preventDefault();
    performance()?.down(`key:${event.code}`, key.x, key.y);
  };

  const keyUp = (event: KeyboardEvent) => {
    scene.performance?.up(`key:${event.code}`);
  };

  const stop = () => {
    scene.performance?.releaseAll();
    synth.releaseAll();
  };

  const visibility = () => {
    if (document.hidden) stop();
  };

  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', up);
  element.addEventListener('lostpointercapture', up);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', stop);
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', visibility);

  return {
    stop,
    dispose() {
      stop();
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('lostpointercapture', up);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', stop);
      window.removeEventListener('pagehide', stop);
      document.removeEventListener('visibilitychange', visibility);
    },
  };
}
