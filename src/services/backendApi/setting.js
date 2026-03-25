import { apiRequest } from './client';

export async function fetchSettings() {
  return await apiRequest('/settings');
}

export async function fetchSetting(name) {
  const data = await apiRequest(`/settings/${name}`);
  return data.value;
}

export async function updateSetting(name, value) {
  await apiRequest(`/settings/${name}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
  return true;
}
