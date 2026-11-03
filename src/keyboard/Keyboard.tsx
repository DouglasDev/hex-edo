import { useEffect, useRef } from 'react';
import { styled } from '@linaria/react';
import * as Phaser from 'phaser';
import type { Synth } from '../audio/Synth';
import type { Settings } from '../instrument/settings';
import { bindInput } from './bindInput';
import { KeyboardScene } from './KeyboardScene';

const Surface = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  canvas {
    display: block;
  }
`;

interface Props {
  settings: Settings;
  desktop: boolean;
  synth: Synth;
  enabled: boolean;
}

export function Keyboard({ settings, desktop, synth, enabled }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;

    if (!element) return;
    const scene = new KeyboardScene(settings, desktop);
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: element,
      width: element.clientWidth,
      height: element.clientHeight,
      backgroundColor: '#0d1119',
      scene,
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false },
      render: { antialias: true, pixelArt: false },
      fps: { target: 30, forceSetTimeOut: true },
    });

    const input = bindInput({ element, scene, synth, timbre: settings.timbre, desktop, enabled });

    const observer = new ResizeObserver(() => {
      input.stop();
      game.scale.resize(element.clientWidth, element.clientHeight);
      scene.resize(element.clientWidth, element.clientHeight);
      scene.performance = undefined;
    });

    observer.observe(element);

    return () => {
      input.dispose();
      observer.disconnect();
      game.destroy(true);
    };
  }, [
    settings.edo,
    settings.a,
    settings.b,
    settings.register,
    settings.size,
    settings.sizeMode,
    settings.timbre,
    desktop,
    enabled,
    synth,
  ]);

  return (
    <Surface
      ref={host}
      data-testid="keyboard"
      role="application"
      aria-label={
        desktop
          ? 'Isomorphic keyboard. Play the letters and numbers shown on the keys.'
          : 'Isomorphic keyboard. Touch keys to play; slide to bend pitch.'
      }
    />
  );
}
