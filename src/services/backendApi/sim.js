import { ENDPOINTS } from '@/services/endpoints';
import { apiRequest } from './client';
import { mapSim } from './mappers';

function toBranchId(value) {
    if (!value || value === 'none') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function createSim(simData) {
    const created = await apiRequest(ENDPOINTS.sims.create, {
        method: 'POST',
        body: JSON.stringify({
            iccid: simData.iccid,
            status: simData.status === 'pending' ? 'inactive' : simData.status || 'inactive',
            branch_id: toBranchId(simData.branchId),
        }),
    });
    return mapSim(created);
}

export async function importSimsFromExcel(params) {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.status) {
        formData.append('status', params.status);
    }
    const branchId = toBranchId(params.branchId);
    if (branchId !== null) {
        formData.append('branch_id', String(branchId));
    }

    return apiRequest(ENDPOINTS.sims.importExcel, {
        method: 'POST',
        body: formData,
    });
}

export async function updateSim(id, simData) {
    const updated = await apiRequest(ENDPOINTS.sims.byId(id), {
        method: 'PUT',
        body: JSON.stringify({
            iccid: simData.iccid,
            status: simData.status === 'pending' ? 'inactive' : simData.status,
            branch_id: toBranchId(simData.branchId),
        }),
    });
    return mapSim(updated);
}
export async function getSimLifecycleHistory(id) {
    return apiRequest(ENDPOINTS.sims.history(id));
}
export async function deleteSim(id) {
    await apiRequest(ENDPOINTS.sims.byId(id), { method: 'DELETE' });
}
export async function assignSale(params) {
    await apiRequest(ENDPOINTS.transactions.process, {
        method: 'POST',
        body: JSON.stringify({
            customer_id: Number(params.customerId),
            transaction_type: 'sale',
            sim_id: Number(params.simId),
            msisdn_id: Number(params.msisdnId),
            plan_id: Number(params.planId),
            items: [{ sim_id: Number(params.simId), amount: Number(params.amount) || 0 }],
        }),
    });
}
