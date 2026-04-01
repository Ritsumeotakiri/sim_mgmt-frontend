export function customerMatchesName(customer, keyword) {
  const normalizedKeyword = String(keyword || '').toLowerCase().trim();
  if (!normalizedKeyword) {
    return true;
  }

  return String(customer?.name || '').toLowerCase().includes(normalizedKeyword);
}

export function toCustomerSummary(customer) {
  return {
    id: customer?.id,
    name: customer?.name || 'Unknown',
    email: customer?.email || 'No email',
    phone: customer?.phone || 'No phone',
  };
}
