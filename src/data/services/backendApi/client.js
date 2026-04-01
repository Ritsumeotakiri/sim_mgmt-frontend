const API_BASE = '/api';
const AUTH_STORAGE_KEY = 'sim-auth-session';
const AUTH_EXPIRED_EVENT = 'sim-auth-expired';
const AUTH_EXPIRED_ERROR_CODE = 'AUTH_EXPIRED';
let authExpiredNotified = false;

export function resetAuthExpiredState() {
    authExpiredNotified = false;
}

function createAuthExpiredError() {
    const error = new Error('Session expired. Please log in again.');
    error.code = AUTH_EXPIRED_ERROR_CODE;
    return error;
}

export function isAuthExpiredError(error) {
    return Boolean(error && typeof error === 'object' && error.code === AUTH_EXPIRED_ERROR_CODE);
}

function getTokenExpiryMs(token) {
    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) {
            return null;
        }
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        if (typeof payload?.exp !== 'number') {
            return null;
        }
        return payload.exp * 1000;
    }
    catch {
        return null;
    }
}

function notifyAuthExpired(token) {
    if (authExpiredNotified) {
        return false;
    }
    authExpiredNotified = true;
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, {
            detail: { token: token || null },
        }));
    }
    return true;
}

function getAuthToken() {
    if (typeof window === 'undefined')
        return null;
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        return parsed.token || null;
    }
    catch {
        return null;
    }
}

function getRequestToken(path) {
    if (path.startsWith('/auth/') && path !== '/auth/logout') {
        return null;
    }
    const token = getAuthToken();
    if (!token) {
        return null;
    }
    const tokenExpiryMs = getTokenExpiryMs(token);
    if (tokenExpiryMs && tokenExpiryMs <= Date.now()) {
        notifyAuthExpired(token);
        throw createAuthExpiredError();
    }
    return token;
}

async function executeRequest(path, init) {
    const method = init?.method || 'GET';
    const url = `${API_BASE}${path}`;
    const token = getRequestToken(path);
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
    if (import.meta.env.DEV) {
        console.info(`[API] ${method} ${url}`, init?.body ? { body: init.body } : undefined);
    }
    const response = await fetch(url, {
        headers: {
            ...defaultHeaders,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.headers || {}),
        },
        ...init,
    });
    let payload = null;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (import.meta.env.DEV) {
        console.info(`[API] ${method} ${url} -> ${response.status}`, payload ?? '[non-json response]');
    }
    const isUnauthorized = response.status === 401 && !path.startsWith('/auth/');
    if (isUnauthorized) {
        notifyAuthExpired(token);
        throw createAuthExpiredError();
    }
    if (!response.ok || payload?.success === false) {
        const message = payload?.message || payload?.error || `Request failed: ${response.status}`;
        if (import.meta.env.DEV) {
            console.error(`[API] ${method} ${url} failed`, { status: response.status, payload });
        }
        throw new Error(message);
    }
    return payload;
}

export async function apiRequest(path, init) {
    const payload = await executeRequest(path, init);
    return payload.data;
}

export async function apiRequestWithMeta(path, init) {
    return executeRequest(path, init);
}

