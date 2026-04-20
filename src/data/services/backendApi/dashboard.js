import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';

export async function getOperatorPerformance() {
    return apiRequest(ENDPOINTS.dashboard.operatorPerformance);
}

export async function getPlanRevenue() {
    return apiRequest(ENDPOINTS.dashboard.planRevenue);
}

export async function getPlanRevenueByBranch() {
    return apiRequest(ENDPOINTS.dashboard.planRevenueByBranch);
}

export async function getRevenues(params = {}) {
    const qs = new URLSearchParams();
    Object.keys(params).forEach((k) => {
        if (params[k] !== undefined && params[k] !== null) {
            qs.append(k, String(params[k]));
        }
    });
    const path = `${ENDPOINTS.dashboard.revenueList}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiRequest(path);
}

export async function getRevenueSummary(params = {}) {
    const qs = new URLSearchParams();
    Object.keys(params).forEach((k) => {
        if (params[k] !== undefined && params[k] !== null) {
            qs.append(k, String(params[k]));
        }
    });
    const path = `${ENDPOINTS.dashboard.revenueSummary}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiRequest(path);
}

export async function getRevenueById(id) {
    if (!id) return null;
    const path = ENDPOINTS.dashboard.revenueDetail(id);
    return apiRequest(path);
}

