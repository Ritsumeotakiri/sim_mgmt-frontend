import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest } from './client';
export async function sendTestNotification() {
    await apiRequest(ENDPOINTS.notifications.test, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

