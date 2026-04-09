import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';

export async function getAllBranches() {
    return apiRequest(ENDPOINTS.branches.list);
}

export async function getBranchById(id) {
    return apiRequest(ENDPOINTS.branches.byId(id));
}

export async function createBranch(branch) {
    return apiRequest(ENDPOINTS.branches.create, {
        method: 'POST',
        body: JSON.stringify({
            name: branch.name,
            location: branch.location || '',
        }),
    });
}

