export const RADAR_VIEW = 340;
export const RADAR_CX = 170;
export const RADAR_CY = 170;
/** Outer ring. Score 10 sits here — matches docs/wireframe.html (r=130). */
export const RADAR_R = 130;
export const RADAR_LABEL_R = 148;
export const RADAR_RINGS = [0.25, 0.5, 0.75, 1] as const;

export function axisAngle(index: number, count: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / count;
}

export function valuePoint(
  index: number,
  count: number,
  value: number,
  radius = RADAR_R,
): { x: number; y: number } {
  const angle = axisAngle(index, count);
  const t = value / 10;
  return {
    x: RADAR_CX + Math.cos(angle) * radius * t,
    y: RADAR_CY + Math.sin(angle) * radius * t,
  };
}

export function labelPoint(index: number, count: number): { x: number; y: number } {
  const angle = axisAngle(index, count);
  return {
    x: RADAR_CX + Math.cos(angle) * RADAR_LABEL_R,
    y: RADAR_CY + Math.sin(angle) * RADAR_LABEL_R,
  };
}

/** Connect defined vertices only. Null is omitted — never plotted at the centre. */
export function polygonPath(
  values: Array<number | null>,
  count: number,
): string | null {
  const points = values.flatMap((value, index) =>
    value == null ? [] : [valuePoint(index, count, value)],
  );

  if (points.length < 2) {
    return null;
  }

  const body = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");

  return points.length >= 3 ? `${body} Z` : body;
}
