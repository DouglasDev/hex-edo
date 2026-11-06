import { validMapping, type Mapping } from './tuning';

export type Timbre = 'sine' | 'triangle' | 'sawtooth';

export interface Settings extends Mapping {
  size: number;
  sizeMode: 'rows' | 'pixels';
  timbre: Timbre;
  volume: number;
  touchInput: 'pointer' | 'touch';
}

export const DEFAULTS: Settings = {
  edo: 7,
  a: 1,
  b: 4,
  register: 0,
  size: 76,
  sizeMode: 'rows',
  timbre: 'triangle',
  volume: 0.6,
  touchInput: 'pointer',
};

const STORAGE_KEY = 'hex-edo.settings.v3';
const PREVIOUS_KEY = 'hex-edo.settings.v2';
const LEGACY_KEY = 'hex-edo.settings.v1';

export function readSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const previous = localStorage.getItem(PREVIOUS_KEY);
    const value = JSON.parse(stored ?? previous ?? localStorage.getItem(LEGACY_KEY) ?? 'null');

    if (
      !value ||
      !Number.isInteger(value.edo) ||
      value.edo < 2 ||
      value.edo > 9 ||
      !validMapping(value.a, value.b, value.edo) ||
      Math.abs(value.a) > 12 ||
      Math.abs(value.b) > 12 ||
      !Number.isInteger(value.register) ||
      Math.abs(value.register) > 2 ||
      !Number.isFinite(value.size) ||
      value.size < 48 ||
      value.size > (stored === null ? 112 : 240) ||
      (stored !== null && !['rows', 'pixels'].includes(value.sizeMode)) ||
      !['sine', 'triangle', 'sawtooth'].includes(value.timbre) ||
      !Number.isFinite(value.volume) ||
      value.volume < 0 ||
      value.volume > 1
    )
      return { ...DEFAULTS };

    return {
      ...value,
      touchInput: value.touchInput === 'touch' ? 'touch' : 'pointer',
      sizeMode: stored !== null ? value.sizeMode : value.size === 76 ? 'rows' : 'pixels',
      volume:
        stored === null && previous === null && value.volume === 0.3
          ? DEFAULTS.volume
          : value.volume,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Storage is optional. */
  }
}
