export function isValidAmount(amount) {
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) && parsed > 0;
}

export function parseAmount(amount) {
  return Number.parseFloat(amount);
}
