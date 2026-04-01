import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from './client';
import { asDate, mapCustomer, mapMsisdn, mapPlan, mapSim, mapTransaction, mapUser } from './mappers';

async function loadAllPages(endpoint) {
    const firstPage = await apiRequestWithMeta(`${endpoint}?page=1&pageSize=100`);
    const firstData = Array.isArray(firstPage?.data) ? firstPage.data : [];
    const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages || 1));

    if (totalPages === 1) {
        return firstData;
    }

    const remainingRequests = [];
    for (let page = 2; page <= totalPages; page += 1) {
        remainingRequests.push(apiRequestWithMeta(`${endpoint}?page=${page}&pageSize=100`));
    }

    const remainingResponses = await Promise.all(remainingRequests);
    const remainingData = remainingResponses.flatMap((response) => (Array.isArray(response?.data) ? response.data : []));

    return [...firstData, ...remainingData];
}

export async function getInitialData() {
    const [simsRaw, numbersRaw, customersRaw, plansRaw, transactionsRaw, usersRaw] = await Promise.all([
        loadAllPages(ENDPOINTS.sims.list),
        loadAllPages(ENDPOINTS.numberPool.list),
        loadAllPages(ENDPOINTS.customers.list),
        loadAllPages(ENDPOINTS.plans.list),
        loadAllPages(ENDPOINTS.transactions.list),
        loadAllPages(ENDPOINTS.users.list),
    ]);
    const sims = simsRaw.map(mapSim);
    const msisdns = numbersRaw.map((item) => {
        const mapped = mapMsisdn(item);
        const linkedSimRaw = simsRaw.find((sim) => String(sim.msisdn_id || '') === String(item.id || '') ||
            String(sim.msisdn || '') === String(item.msisdn || ''));
        const linkedSim = linkedSimRaw ? mapSim(linkedSimRaw) : null;
        const normalizedStatus = linkedSim
            ? 'assigned'
            : mapped.status === 'assigned'
                ? 'available'
                : mapped.status;
        return {
            ...mapped,
            status: normalizedStatus,
            simId: mapped.simId || linkedSim?.id || null,
            simIccid: mapped.simIccid || linkedSim?.iccid || null,
            assignedAt: mapped.assignedAt || (linkedSim ? new Date() : null),
        };
    });
    const customers = customersRaw.map(mapCustomer);
    const plans = plansRaw.map(mapPlan);
    const users = usersRaw.map(mapUser);
    const transactions = transactionsRaw.map(mapTransaction);
    return { sims, msisdns, customers, plans, transactions, users };
}
export function mapCreatedCustomerEmail(name) {
    return `${String(name).toLowerCase().replace(/\s+/g, '.')}@sim.local`;
}
export { asDate };

