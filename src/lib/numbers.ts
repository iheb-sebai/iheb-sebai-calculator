/** A whole number ≥ 0 that JavaScript stores exactly (so never NaN, Infinity or a decimal). */
export function isWholeNumber(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * a ÷ b rounded up (D-1), for whole numbers a ≥ 0 and b ≥ 1.
 *
 * Floating-point division is exact enough here: when b divides a the quotient is
 * exact, and otherwise it is at least 1/b away from a whole number, far more than
 * any rounding error at these sizes.
 */
export function divideRoundingUp(a: number, b: number): number {
  return Math.ceil(a / b);
}
