const LOG_ENDPOINT = '/logs/frontend';

export async function sendFrontendLog({ level = 'info', message, meta } = {}) {
  if (!message || typeof message !== 'string') {
    return;
  }

  try {
    await fetch(`/api${LOG_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ level, message, meta }),
    });
  } catch {
    // Avoid throwing from a logging call
  }
}
