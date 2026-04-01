import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';

export async function login(params) {
    const identifier = params.username || params.email || '';
    const data = await apiRequest(ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({
            email: identifier,
            username: identifier.includes('@') ? undefined : identifier,
            password: params.password,
        }),
    });
    return {
        token: data.token,
        user: data.user,
    };
}

