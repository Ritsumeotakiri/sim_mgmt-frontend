export const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
};

export const formatNumberDisplay = (value) => String(value || '').replace(/^\+855\s?/, '');