export function calculatePercentageChange(a, b) {
  if (b === 0)
    throw new Error('Cannot calculate percentage change: division by zero');

  return ((a - b) / b) * 100;
}
