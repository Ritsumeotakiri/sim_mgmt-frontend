import { sendFrontendLog } from './logs';

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

// Cookie-based auth: JWT is stored in an HttpOnly cookie, so frontend JS can't read it.
// The browser sends it automatically when `credentials: 'include'` is set.

async function executeRequest(path, init) {
    const method = init?.method || 'GET';
    const url = `${API_BASE}${path}`;
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
    if (import.meta.env.DEV) {
        console.info(`[API] ${method} ${url}`, { ...init, body: undefined });
    }
    try {
        const response = await fetch(url, {
            ...init,
            credentials: 'include',
            headers: {
                ...defaultHeaders,
                ...(init?.headers || {}),
            },
        });
    let payload = null;
    try {
        payload = (await response.json());
    }
    catch {
        payload = null;
    }
    if (import.meta.env.DEV) {
        console.info(`[API] ${method} ${url} response`, { status: response.status, payload });
    }
    const isUnauthorized = response.status === 401 && path !== '/auth/login';
    if (isUnauthorized) {
        notifyAuthExpired(null);
        throw createAuthExpiredError();
    }
        if (!response.ok || payload?.success === false) {
            const message = payload?.message || payload?.error || `Request failed: ${response.status}`;
            if (import.meta.env.DEV) {
                console.error(`[API] ${method} ${url} failed`, { status: response.status, payload });
            }
            void sendFrontendLog({
                level: 'error',
                message: `[API] ${method} ${url} failed`,
                meta: { status: response.status, payload },
            });
            throw new Error(message);
        }
        return payload;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error(`[API] ${method} ${url} error`, error);
        }
        void sendFrontendLog({
            level: 'error',
            message: `[API] ${method} ${url} error`,
            meta: { error: error?.message || String(error) },
        });
        throw error;
    }
}

export async function apiRequest(path, init) {
    const payload = await executeRequest(path, init);
    return payload.data;
}

export async function apiRequestWithMeta(path, init) {
    return executeRequest(path, init);
}

