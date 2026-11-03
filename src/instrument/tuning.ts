export const REFERENCE = 261.6255653005986;

export interface Mapping {
  edo: number;
  a: number;
  b: number;
  register: number;
}

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function validMapping(a: number, b: number, edo: number): boolean {
  return Number.isInteger(a) && Number.isInteger(b) && gcd(gcd(a, b), edo) === 1;
}

export function frequency(step: number, edo: number): number {
  return REFERENCE * 2 ** (step / edo);
}

export function stepAt(q: number, r: number, origin: number, mapping: Mapping): number {
  return origin + mapping.a * q + mapping.b * r + mapping.register * mapping.edo;
}

export function noteLabel(step: number, edo: number): string {
  return `${mod(step, edo)} · ${4 + Math.floor(step / edo)}`;
}
