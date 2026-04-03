const LOG_ENDPOINT = '/logs/frontend';
const AUTH_STORAGE_KEY = 'sim-auth-session';

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export async function sendFrontendLog({ level = 'info', message, meta } = {}) {
  if (!message || typeof message !== 'string') {
    return;
  }

  const token = getAuthToken();

  try {
    await fetch(`/api${LOG_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ level, message, meta }),
    });
  } catch {
    // Avoid throwing from a logging call
  }
}
