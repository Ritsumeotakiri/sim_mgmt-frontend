import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';

export async function getOperatorPerformance() {
    return apiRequest(ENDPOINTS.dashboard.operatorPerformance);
}

