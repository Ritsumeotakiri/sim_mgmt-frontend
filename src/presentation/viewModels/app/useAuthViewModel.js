import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { backendApi } from '@/data/services/backendApi';
import { resetAuthExpiredState } from '@/data/services/backendApi/client';
import { resolveFrontendUserRole } from '@/data/services/backendApi/mappers';
const AUTH_STORAGE_KEY = 'sim-auth-session';
const AUTH_EXPIRED_EVENT = 'sim-auth-expired';
const LEGACY_AUTH_STORAGE_KEYS = ['token', 'authToken', 'sim-auth-token', 'sim_user', 'user'];
const UNAUTHENTICATED_STATE = {
    isAuthenticated: false,
    userRole: null,
    userEmail: null,
    userName: '',
    userBranchId: null,
    token: null,
};

function decodeJwtPayload(token) {
    try {
        const payloadPart = String(token || '').split('.')[1];
        if (!payloadPart) {
            return null;
        }
        const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        return JSON.parse(atob(padded));
    }
    catch {
        return null;
    }
}

function getStoredAuth() {
    if (typeof window === 'undefined') {
        return UNAUTHENTICATED_STATE;
    }
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
            return UNAUTHENTICATED_STATE;
        }
        const parsed = JSON.parse(raw);
        if (!parsed?.token || !parsed?.userRole || !parsed?.userEmail || !parsed?.userName) {
            return UNAUTHENTICATED_STATE;
        }

        const tokenPayload = decodeJwtPayload(parsed.token);
        const resolvedRole = tokenPayload
            ? resolveFrontendUserRole({ role: tokenPayload.role, username: tokenPayload.username, user_id: tokenPayload.user_id })
            : parsed.userRole;
        const resolvedBranchId = tokenPayload?.branch_id ?? parsed.userBranchId ?? null;
        const resolvedUserId = tokenPayload?.user_id ?? parsed.userId ?? null;

        return {
            isAuthenticated: true,
            userRole: resolvedRole,
            userEmail: parsed.userEmail,
            userName: parsed.userName,
            userBranchId: resolvedBranchId,
            userId: resolvedUserId,
            token: parsed.token,
        };
    }
    catch {
        return UNAUTHENTICATED_STATE;
    }
}
export function useAuth() {
    const [auth, setAuth] = useState(() => getStoredAuth());
    const clearAuthStorage = () => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
            window.localStorage.removeItem(key);
        });
    };

    useEffect(() => {
        const handleAuthExpired = (event) => {
            const eventToken = event?.detail?.token || null;
            let currentStoredToken = null;

            if (typeof window !== 'undefined') {
                try {
                    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
                    const parsed = raw ? JSON.parse(raw) : null;
                    currentStoredToken = parsed?.token || null;
                }
                catch {
                    currentStoredToken = null;
                }
            }

            if (eventToken && currentStoredToken && eventToken !== currentStoredToken) {
                return;
            }

            setAuth(UNAUTHENTICATED_STATE);
            clearAuthStorage();
            toast.error('Session expired. Please log in again.');
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
        return () => {
            window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
        };
    }, []);
    const handleLogin = async (identifier, password) => {
        const userNames = {
            admin: 'Administrator',
            manager: 'Manager',
            operator: 'Operator',
            viewer: 'Viewer',
        };
        try {
            const loginResult = await backendApi.login({ email: identifier, password });
            const resolvedRole = resolveFrontendUserRole(loginResult.user);
            const userName = userNames[resolvedRole];
            resetAuthExpiredState();
            // Use loginResult.user.id (string) as userId, fallback to user_id if needed
            const userId = loginResult.user?.id ?? loginResult.user?.user_id ?? null;
            setAuth({
                isAuthenticated: true,
                userRole: resolvedRole,
                userEmail: identifier,
                userName,
                userBranchId: loginResult.user?.branch_id ?? null,
                userId,
                token: loginResult.token,
            });
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                isAuthenticated: true,
                userRole: resolvedRole,
                userEmail: identifier,
                userName,
                userBranchId: loginResult.user?.branch_id ?? null,
                userId,
                token: loginResult.token,
            }));
            toast.success(`Welcome, ${userName}!`);
            return true;
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed');
            return false;
        }
    };
    const handleLogout = () => {
        setAuth(UNAUTHENTICATED_STATE);
        resetAuthExpiredState();
        clearAuthStorage();
        toast.info('You have been logged out');
    };
    return {
        auth,
        handleLogin,
        handleLogout,
    };
}

