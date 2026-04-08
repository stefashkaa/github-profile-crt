export interface ChartPoint {
  x: number;
  y: number;
}

export function buildSteppedPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const firstPoint = points[0]!;
  let path = `M ${firstPoint.x} ${firstPoint.y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]!;
    const point = points[index]!;

    path += ` L ${point.x} ${previousPoint.y} L ${point.x} ${point.y}`;
  }

  return path;
}

export function buildAreaPath(points: ChartPoint[], baseY: number): string {
  if (points.length === 0) {
    return '';
  }

  const firstPoint = points[0]!;
  let path = `M ${firstPoint.x} ${baseY} L ${firstPoint.x} ${firstPoint.y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]!;
    const point = points[index]!;

    path += ` L ${point.x} ${previousPoint.y} L ${point.x} ${point.y}`;
  }

  const lastPoint = points[points.length - 1]!;
  path += ` L ${lastPoint.x} ${baseY} Z`;

  return path;
}
