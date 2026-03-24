import { ENDPOINTS } from '@/services/endpoints';
import { apiRequest } from './client';
import { asDate } from './mappers';

function mapCustomerPayload(payload, fallback = {}) {
    const id = payload.id ?? payload.customer_id ?? fallback.id;
    const fullName = payload.full_name ?? fallback.name ?? '';
    return {
        id: id ? String(id) : String(Date.now()),
        name: fullName,
        email: fallback.email || `${String(fullName).toLowerCase().replace(/\s+/g, '.')}@sim.local`,
        phone: payload.phone || fallback.phone || '-',
        address: fallback.address || '-',
        idNumber: payload.id_number || fallback.idNumber || '-',
        createdAt: asDate(payload.created_at || fallback.createdAt),
    };
}

export async function createCustomer(customer) {
    const created = await apiRequest(ENDPOINTS.customers.create, {
        method: 'POST',
        body: JSON.stringify({
            full_name: customer.name,
            phone: customer.phone,
            id_number: customer.idNumber,
        }),
    });
    return mapCustomerPayload(created, customer);
}

export async function updateCustomer(id, customer) {
    const updated = await apiRequest(ENDPOINTS.customers.byId(id), {
        method: 'PUT',
        body: JSON.stringify({
            full_name: customer.name,
            phone: customer.phone,
            id_number: customer.idNumber,
        }),
    });
    return mapCustomerPayload(updated, customer);
}

export async function deleteCustomer(id) {
    await apiRequest(ENDPOINTS.customers.byId(id), {
        method: 'DELETE',
    });
}
