import { validMapping, type Mapping } from './tuning';

export type Timbre = 'sine' | 'triangle' | 'sawtooth';

export interface Settings extends Mapping {
  size: number;
  timbre: Timbre;
  volume: number;
}

export const DEFAULTS: Settings = {
  edo: 7,
  a: 1,
  b: 4,
  register: 0,
  size: 76,
  timbre: 'triangle',
  volume: 0.3,
};

const STORAGE_KEY = 'hex-edo.settings.v1';

export function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

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
      value.size > 112 ||
      !['sine', 'triangle', 'sawtooth'].includes(value.timbre) ||
      !Number.isFinite(value.volume) ||
      value.volume < 0 ||
      value.volume > 1
    )
      return { ...DEFAULTS };

    return value;
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
