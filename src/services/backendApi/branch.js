import { ENDPOINTS } from '@/services/endpoints';
import { apiRequest } from './client';

export async function createBranch(branch) {
    return apiRequest(ENDPOINTS.branches.create, {
        method: 'POST',
        body: JSON.stringify({
            name: branch.name,
            location: branch.location || '',
        }),
    });
}
