import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';
import { mapUser, setUserAvatarOverride, toBackendRole } from './mappers';

function toBranchId(value) {
    if (!value || value === 'none') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function createUser(user) {
    const created = await apiRequest(ENDPOINTS.users.create, {
        method: 'POST',
        body: JSON.stringify({
            username: user.name,
            password: user.password || 'password123',
            role: toBackendRole((user.role || 'viewer')),
            branch_id: toBranchId(user.branchId),
        }),
    });
    const mapped = mapUser(created);
    if (user.avatar) {
        setUserAvatarOverride(mapped.id, user.avatar);
        return {
            ...mapped,
            avatar: user.avatar,
        };
    }
    return mapped;
}
export async function updateUser(user) {
    const updated = await apiRequest(ENDPOINTS.users.byId(user.id), {
        method: 'PUT',
        body: JSON.stringify({
            username: user.name,
            password: user.password || 'password123',
            role: toBackendRole(user.role),
            branch_id: toBranchId(user.branchId),
        }),
    });
    const mapped = mapUser(updated);
    if (user.avatar) {
        setUserAvatarOverride(mapped.id || user.id, user.avatar);
        return {
            ...mapped,
            avatar: user.avatar,
        };
    }
    return mapped;
}
export async function deleteUser(id) {
    await apiRequest(ENDPOINTS.users.byId(id), { method: 'DELETE' });
}

