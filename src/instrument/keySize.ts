export const MOBILE_ROWS = 5;

export function diameterForRows(height: number, rows = MOBILE_ROWS): number {
  return Math.max(1, height / (1 + 0.75 * (rows - 1)));
}

export function keySizeLabel(diameter: number): string {
  const format = (value: number) => Number(value.toFixed(1)).toString();

  return `${format((Math.sqrt(3) * diameter) / 2)} × ${format(diameter)} px (width × height)`;
}
