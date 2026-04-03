import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';

export async function fetchSettings() {
  return apiRequest(ENDPOINTS.settings.list);
}

export async function fetchSetting(name) {
  const data = await apiRequest(ENDPOINTS.settings.byName(name));
  return data.value;
}

export async function updateSetting(name, value) {
  await apiRequest(ENDPOINTS.settings.byName(name), {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
  return true;
}

export async function fetchAlertThresholds(branchId) {
  return apiRequest(ENDPOINTS.settings.alertThresholds(branchId));
}

export async function updateAlertThresholds(branchId, payload) {
  return apiRequest(ENDPOINTS.settings.alertThresholds(branchId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

