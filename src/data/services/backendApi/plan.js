import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';
import { mapPlan } from './mappers';
export async function createPlan(data) {
    const created = await apiRequest(ENDPOINTS.plans.create, {
        method: 'POST',
        body: JSON.stringify({
            name: data.name,
            price: data.price,
            duration_days: data.durationDays,
            data_limit: data.dataLimit,
        }),
    });
    return mapPlan(created);
}
export async function updatePlan(id, data) {
    const updated = await apiRequest(ENDPOINTS.plans.byId(id), {
        method: 'PUT',
        body: JSON.stringify({
            name: data.name,
            price: data.price,
            duration_days: data.durationDays,
            data_limit: data.dataLimit,
        }),
    });
    return mapPlan(updated);
}
export async function deletePlan(id) {
    await apiRequest(ENDPOINTS.plans.byId(id), { method: 'DELETE' });
}

