import { ENDPOINTS } from '@/services/endpoints';
import { apiRequest } from './client';
import { mapSim } from './mappers';

// Helper function to safely convert to number
const toSafeNumber = (value, fallback = null) => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && !isNaN(parsed) ? parsed : fallback;
};

// Helper function to validate required fields for top-up
const validateTopUpParams = (params) => {
    const errors = [];
    
    if (!params.userId && params.userId !== 0) {
        errors.push('userId is required');
    }
    if (!params.branchId && params.branchId !== 0) {
        errors.push('branchId is required');
    }
    if (!params.customerId && params.customerId !== 0) {
        errors.push('customerId is required');
    }
    if (!params.simId && params.simId !== 0) {
        errors.push('simId is required');
    }
    if (!params.amount && params.amount !== 0) {
        errors.push('amount is required');
    }
    
    if (errors.length > 0) {
        throw new Error(`Missing required fields: ${errors.join(', ')}`);
    }
    
    const userIdNum = toSafeNumber(params.userId);
    const branchIdNum = toSafeNumber(params.branchId);
    const customerIdNum = toSafeNumber(params.customerId);
    const simIdNum = toSafeNumber(params.simId);
    const amountNum = toSafeNumber(params.amount);
    
    if (userIdNum === null) {
        throw new Error('userId must be a valid number');
    }
    if (branchIdNum === null) {
        throw new Error('branchId must be a valid number');
    }
    if (customerIdNum === null) {
        throw new Error('customerId must be a valid number');
    }
    if (simIdNum === null) {
        throw new Error('simId must be a valid number');
    }
    if (amountNum === null || amountNum <= 0) {
        throw new Error('amount must be a valid number greater than 0');
    }
    
    return {
        userId: userIdNum,
        branchId: branchIdNum,
        customerId: customerIdNum,
        simId: simIdNum,
        amount: amountNum,
    };
};

export async function addBalanceToSim(params) {
    try {
        // Validate and sanitize input
        const validated = validateTopUpParams(params);
        
        const payload = {
            transaction_type: "top_up",
            user_id: validated.userId,
            branch_id: validated.branchId,
            customer_id: validated.customerId,
            items: [
                { 
                    sim_id: validated.simId, 
                    amount: validated.amount 
                }
            ],
            soap_method: "ProcessSimTransaction"
        };
        
        console.log('addBalanceToSim payload:', payload);
        
        return apiRequest(ENDPOINTS.transactions.process, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error('Error in addBalanceToSim:', error);
        throw error;
    }
}

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
    // Validate required fields for sale
    if (!params.customerId) {
        throw new Error('customerId is required for sale');
    }
    if (!params.simId) {
        throw new Error('simId is required for sale');
    }
    
    await apiRequest(ENDPOINTS.transactions.process, {
        method: 'POST',
        body: JSON.stringify({
            customer_id: Number(params.customerId),
            transaction_type: 'sale',
            sim_id: Number(params.simId),
            msisdn_id: params.msisdnId ? Number(params.msisdnId) : undefined,
            plan_id: params.planId ? Number(params.planId) : undefined,
            items: [{ sim_id: Number(params.simId), amount: Number(params.amount) || 0 }],
        }),
    });
}