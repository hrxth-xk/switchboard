/** Shared SVG arc math for the horseshoe gauges (dashboard + landing preview). */

export function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

export function arcPath(cx: number, cy: number, radius: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, radius, startDeg);
  const end = polar(cx, cy, radius, endDeg);
  const sweep = (endDeg - startDeg + 360) % 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Stroke length of the arc, used for the draw-in dash animation. */
export function arcLength(radius: number, startDeg: number, endDeg: number) {
  const sweep = (endDeg - startDeg + 360) % 360;
  return (2 * Math.PI * radius * sweep) / 360;
}
