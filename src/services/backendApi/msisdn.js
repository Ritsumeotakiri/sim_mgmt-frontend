import { ENDPOINTS } from '@/services/endpoints';
import { apiRequest } from './client';
import { mapMsisdn } from './mappers';

function toBranchId(value) {
    if (!value || value === 'none') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function createMsisdn(number, price = 0) {
    const created = await apiRequest(ENDPOINTS.numberPool.create, {
        method: 'POST',
        body: JSON.stringify({ msisdn: number, price: Number(price || 0), status: 'available' }),
    });
    return mapMsisdn(created);
}
export async function createMsisdnWithBranch({ number, price = 0, branchId = null }) {
    const created = await apiRequest(ENDPOINTS.numberPool.create, {
        method: 'POST',
        body: JSON.stringify({ msisdn: number, price: Number(price || 0), status: 'available', branch_id: toBranchId(branchId) }),
    });
    return mapMsisdn(created);
}
export async function importMsisdnFromExcel(params) {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.status) {
        formData.append('status', params.status);
    }
    if (params.price !== undefined && params.price !== null) {
        formData.append('price', String(params.price));
    }
    const branchId = toBranchId(params.branchId);
    if (branchId !== null) {
        formData.append('branch_id', String(branchId));
    }
    return apiRequest(ENDPOINTS.numberPool.importExcel, {
        method: 'POST',
        body: formData,
    });
}
export async function updateMsisdn(id, data) {
    const updated = await apiRequest(ENDPOINTS.numberPool.byId(id), {
        method: 'PUT',
        body: JSON.stringify({ msisdn: data.number, price: Number(data.price || 0), status: data.status, branch_id: toBranchId(data.branchId) }),
    });
    return mapMsisdn(updated);
}
export async function deleteMsisdn(id) {
    await apiRequest(ENDPOINTS.numberPool.byId(id), { method: 'DELETE' });
}
