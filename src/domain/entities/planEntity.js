export function toPlanSummary(plan) {
  return {
    id: plan?.id,
    name: plan?.name || 'Plan',
    price: Number(plan?.price || 0),
  };
}

export function formatPlanPrice(plan) {
  return Number(plan?.price || 0).toFixed(2);
}
