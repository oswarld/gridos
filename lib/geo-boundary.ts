import type { BoundaryGeometry } from "./atlas-types";

export const COASTAL_BOUNDARY_TOLERANCE_DEGREES = 0.05;

function pointInRing([x, y]: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon[0] || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

function pointInBoundary(
  point: [number, number],
  boundary: BoundaryGeometry,
): boolean {
  if (boundary.type === "Polygon") {
    return pointInPolygon(point, boundary.coordinates as number[][][]);
  }
  return (boundary.coordinates as number[][][][]).some((polygon) =>
    pointInPolygon(point, polygon),
  );
}

function pointToSegmentDistance(
  point: [number, number],
  start: number[],
  end: number[],
): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }
  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
        lengthSquared,
    ),
  );
  return Math.hypot(
    point[0] - (start[0] + projection * dx),
    point[1] - (start[1] + projection * dy),
  );
}

function distanceToBoundary(
  point: [number, number],
  boundary: BoundaryGeometry,
): number {
  const polygons =
    boundary.type === "Polygon"
      ? [boundary.coordinates as number[][][]]
      : (boundary.coordinates as number[][][][]);
  let minimum = Number.POSITIVE_INFINITY;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index++) {
        minimum = Math.min(
          minimum,
          pointToSegmentDistance(point, ring[index - 1], ring[index]),
        );
      }
    }
  }
  return minimum;
}

export function pointBelongsToBoundary(
  point: [number, number],
  boundary: BoundaryGeometry,
  toleranceDegrees = COASTAL_BOUNDARY_TOLERANCE_DEGREES,
): boolean {
  return (
    pointInBoundary(point, boundary) ||
    distanceToBoundary(point, boundary) <= toleranceDegrees
  );
}
