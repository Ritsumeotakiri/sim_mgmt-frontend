import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from './client';
import { asDate, mapCustomer, mapMsisdn, mapPlan, mapSim, mapTransaction, mapUser } from './mappers';

async function loadFirstPage(endpoint, { pageSize = 50 } = {}) {
    const response = await apiRequestWithMeta(`${endpoint}?page=1&pageSize=${pageSize}`);
    return Array.isArray(response?.data) ? response.data : [];
}

export async function getInitialData() {
    const [simsRaw, numbersRaw, customersRaw, plansRaw, transactionsRaw, usersRaw] = await Promise.all([
        loadFirstPage(ENDPOINTS.sims.list, { pageSize: 50 }),
        loadFirstPage(ENDPOINTS.numberPool.list, { pageSize: 50 }),
        loadFirstPage(ENDPOINTS.customers.list, { pageSize: 50 }),
        loadFirstPage(ENDPOINTS.plans.list, { pageSize: 100 }),
        loadFirstPage(ENDPOINTS.transactions.list, { pageSize: 50 }),
        loadFirstPage(ENDPOINTS.users.list, { pageSize: 50 }),
    ]);
    const sims = simsRaw.map(mapSim);

    const simByMsisdnId = new Map();
    const simByMsisdnValue = new Map();
    simsRaw.forEach((sim) => {
        const msisdnId = sim.msisdn_id ?? sim.msisdnId;
        if (msisdnId != null) {
            simByMsisdnId.set(String(msisdnId), sim);
        }
        if (sim.msisdn) {
            simByMsisdnValue.set(String(sim.msisdn), sim);
        }
    });

    const msisdns = numbersRaw.map((item) => {
        const mapped = mapMsisdn(item);
        const linkedSimRaw = simByMsisdnId.get(String(item.id ?? ''))
            || simByMsisdnValue.get(String(item.msisdn ?? ''))
            || null;
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

