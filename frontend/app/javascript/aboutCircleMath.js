export const ACCURACY_CIRCLE_RADIUS = 120;

export function circleCircumference(radius) {
  return 2 * Math.PI * radius;
}

export function strokeDashOffset(percent, circumference) {
  return circumference - (percent / 100) * circumference;
}
