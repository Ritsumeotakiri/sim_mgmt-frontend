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
    userId: null,
    token: null,
};

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
        if (!parsed?.userRole || !parsed?.userName) {
            return UNAUTHENTICATED_STATE;
        }

        return {
            isAuthenticated: true,
            userRole: parsed.userRole,
            userEmail: parsed.userEmail ?? null,
            userName: parsed.userName,
            userBranchId: parsed.userBranchId ?? null,
            userId: parsed.userId ?? null,
            token: null,
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
            void event;

            setAuth(UNAUTHENTICATED_STATE);
            clearAuthStorage();
            toast.error('Session expired. Please log in again.');
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
        return () => {
            window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
        };
    }, []);

    useEffect(() => {
        // Try to restore an existing session via HttpOnly cookie.
        // This keeps the user logged in after refresh even though the JWT isn't stored in localStorage.
        const restoreSession = async () => {
            try {
                const me = await backendApi.me();
                const resolvedRole = resolveFrontendUserRole(me);
                const userNames = {
                    admin: 'Administrator',
                    manager: 'Manager',
                    operator: 'Operator',
                    viewer: 'Viewer',
                };
                const restoredAuth = {
                    isAuthenticated: true,
                    userRole: resolvedRole,
                    userEmail: auth.userEmail,
                    userName: userNames[resolvedRole] || auth.userName || '',
                    userBranchId: me.branch_id ?? auth.userBranchId ?? null,
                    userId: me.user_id ?? auth.userId ?? null,
                    token: null,
                };
                setAuth(restoredAuth);
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                        isAuthenticated: true,
                        userRole: restoredAuth.userRole,
                        userEmail: restoredAuth.userEmail,
                        userName: restoredAuth.userName,
                        userBranchId: restoredAuth.userBranchId,
                        userId: restoredAuth.userId,
                    }));
                }
            }
            catch {
                // Ignore restore failures; auth state will be cleared by 401 handling when needed.
            }
        };

        restoreSession();
        // run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                token: null,
            });
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                isAuthenticated: true,
                userRole: resolvedRole,
                userEmail: identifier,
                userName,
                userBranchId: loginResult.user?.branch_id ?? null,
                userId,
            }));
            toast.success(`Welcome, ${userName}!`);
            return true;
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed');
            return false;
        }
    };
    const handleLogout = async () => {
        try {
            await backendApi.logout();
        }
        catch {
            // Ignore logout failures to avoid trapping the user
        }
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

