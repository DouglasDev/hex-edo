import { useCallback, useEffect, useRef, useState } from 'react';

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

export function useMobileDisplay(mobile: boolean, portrait: boolean) {
  const [active, setActive] = useState(Boolean(document.fullscreenElement));
  const [manualRotation, setManualRotation] = useState(false);
  const wanted = useRef(true);
  const pending = useRef(false);
  const wasActive = useRef(Boolean(document.fullscreenElement));
  const supported = Boolean(
    typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled,
  );

  const enter = useCallback(async () => {
    if (!mobile || pending.current || document.fullscreenElement) return;
    pending.current = true;

    try {
      if (
        !document.fullscreenElement &&
        typeof document.documentElement.requestFullscreen === 'function'
      ) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }

      const orientation = screen.orientation as LockableOrientation | undefined;

      if (document.fullscreenElement && orientation?.lock) {
        try {
          await orientation.lock('landscape');
        } catch {
          /* Some browsers require physical rotation. */
        }
      }
    } catch {
      /* A gesture can retry fullscreen when automatic entry is rejected. */
    } finally {
      pending.current = false;
      setManualRotation(window.innerHeight > window.innerWidth);
    }
  }, [mobile]);

  useEffect(() => {
    if (!mobile) return;

    const changed = () => {
      const next = Boolean(document.fullscreenElement);

      if (wasActive.current && !next) {
        wanted.current = false;
        screen.orientation?.unlock?.();
      }

      wasActive.current = next;
      setActive(next);
    };

    document.addEventListener('fullscreenchange', changed);

    return () => document.removeEventListener('fullscreenchange', changed);
  }, [mobile]);

  useEffect(() => {
    if (!mobile || portrait || !wanted.current) return;
    void enter();

    const gesture = (event: MouseEvent) => {
      if (
        !wanted.current ||
        (event.target instanceof Element && event.target.closest('[data-fullscreen-control]'))
      )
        return;
      void enter();
    };

    document.addEventListener('click', gesture, true);

    return () => document.removeEventListener('click', gesture, true);
  }, [mobile, portrait, enter]);

  const start = () => {
    wanted.current = true;
    void enter();
  };

  const toggle = () => {
    if (document.fullscreenElement) {
      wanted.current = false;
      screen.orientation?.unlock?.();
      void document.exitFullscreen().catch(() => {});
    } else start();
  };

  return { active, supported, manualRotation, start, toggle };
}
