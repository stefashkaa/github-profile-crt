export function maxOf(values: number[]): number {
  return values.reduce((currentMax, value) => Math.max(currentMax, value), 0);
}

export function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
