export const normalizeSearchValue = (value) => String(value || '').toLowerCase().trim();

export const computeBestMatchScore = (query, candidate) => {
  const normalizedQuery = normalizeSearchValue(query);
  const normalizedCandidate = normalizeSearchValue(candidate);

  if (!normalizedQuery) {
    return 0;
  }
  if (!normalizedCandidate) {
    return -1;
  }
  if (normalizedCandidate === normalizedQuery) {
    return 120;
  }
  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 90;
  }
  if (normalizedCandidate.includes(` ${normalizedQuery}`)) {
    return 70;
  }
  if (normalizedCandidate.includes(normalizedQuery)) {
    return 50;
  }
  return -1;
};