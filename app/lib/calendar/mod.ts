/**
 * Mathematical modulo: the result always has the sign of `divisor`, so
 * `mod(-1, 28)` is 27 where JavaScript's `-1 % 28` is -1. Everything in this
 * directory that wraps a cycle (weeks, moon, day of year) goes through it.
 */
export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
