function normalizeId(value) {
  return String(value ?? '').trim();
}

export function belongsToCustomer(sim, customerId) {
  return normalizeId(sim?.customerId) === normalizeId(customerId);
}

export function isActiveSim(sim) {
  return String(sim?.status || '').toLowerCase() === 'active';
}

export function toSimSummary(sim) {
  return {
    id: sim?.id,
    msisdn: sim?.msisdn || null,
    iccid: sim?.iccid || null,
    status: sim?.status || 'unknown',
    planId: sim?.planId || null,
  };
}
