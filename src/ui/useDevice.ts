import { useEffect, useState } from 'react';

export function useDevice() {
  const read = () => {
    const mobile =
      matchMedia('(pointer: coarse)').matches &&
      (navigator.maxTouchPoints > 0 || /Mobi|Android/i.test(navigator.userAgent));

    return {
      desktop: !mobile,
      portrait: mobile && window.innerHeight > window.innerWidth,
      height: window.innerHeight,
    };
  };

  const [device, setDevice] = useState(read);

  useEffect(() => {
    const orientation = matchMedia('(orientation: portrait)');
    const pointer = matchMedia('(pointer: coarse)');

    const update = () => setDevice(read());

    orientation.addEventListener('change', update);
    window.addEventListener('resize', update);
    update();
    pointer.addEventListener('change', update);

    return () => {
      orientation.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      pointer.removeEventListener('change', update);
    };
  }, []);

  return device;
}
