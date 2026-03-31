export function asDate(value) {
    if (!value)
        return new Date();
    if (value instanceof Date)
        return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
function mapRole(role) {
    if (role === 'admin')
        return 'admin';
    if (role === 'manager')
        return 'manager';
    if (role === 'operator')
        return 'operator';
    if (role === 'viewer')
        return 'viewer';
    if (role === 'sales')
        return 'operator';
    if (role === 'support')
        return 'viewer';
    return 'viewer';
}

const USER_AVATAR_OVERRIDES_KEY = 'sim-user-avatar-overrides';

function readAvatarOverrides() {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const raw = window.localStorage.getItem(USER_AVATAR_OVERRIDES_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}

function writeAvatarOverrides(overrides) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(USER_AVATAR_OVERRIDES_KEY, JSON.stringify(overrides));
    }
    catch {
        // ignore storage errors
    }
}



export function setUserRoleOverride(userId, username, role) {
    // role overrides are deprecated; backend role is the single source of truth
    void userId;
    void username;
    void role;
}



export function setUserAvatarOverride(userId, avatarUrl) {
    if (!userId || !avatarUrl) {
        return;
    }
    const overrides = readAvatarOverrides();
    overrides[String(userId)] = avatarUrl;
    writeAvatarOverrides(overrides);
}

export function resolveFrontendUserRole(item) {
    const rawRole = String(item?.role || '').toLowerCase();
    const username = String(item?.username || '').toLowerCase();

    if (['admin', 'manager', 'operator', 'viewer'].includes(rawRole)) {
        return rawRole;
    }

    if (rawRole === 'sales') {
        if (username.includes('manager')) {
            return 'manager';
        }
        return 'operator';
    }

    if (rawRole === 'support') {
        if (username.includes('manager')) {
            return 'manager';
        }
        if (username.includes('operator')) {
            return 'operator';
        }
        return 'viewer';
    }

    return mapRole(rawRole);
}

function resolveAvatar(item, id) {
    const overrides = readAvatarOverrides();
    if (id && overrides[String(id)]) {
        return overrides[String(id)];
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`;
}
function mapSimStatus(status) {
    if (status === 'active')
        return 'active';
    if (status === 'suspended' || status === 'blocked')
        return 'suspended';
    return 'inactive';
}
export function mapSim(sim) {
    const simId = sim.id ?? sim.sim_id;
    return {
        id: simId ? String(simId) : '',
        iccid: sim.iccid,
        msisdn: sim.msisdn || null,
        status: mapSimStatus(sim.status),
        branchId: sim.branch_id != null ? String(sim.branch_id) : null,
        branchName: sim.branch_name || null,
        customerId: sim.customer_id ? String(sim.customer_id) : null,
        planId: sim.plan_id ? String(sim.plan_id) : null,
        assignedTo: sim.customer_name || null,
        createdAt: asDate(sim.created_at),
        updatedAt: asDate(sim.updated_at || sim.created_at),
    };
}
export function mapMsisdn(item) {
    const hasSimLink = item.sim_id != null || item.sim_iccid != null;
    const mappedAssignedAt = item.status === 'assigned'
        ? asDate(item.sim_updated_at || item.updated_at)
        : null;

    return {
        id: item.id ? String(item.id) : '',
        number: item.msisdn,
        price: Number(item.price || 0),
        status: item.status === 'assigned' ? 'assigned' : 'available',
        branchId: item.branch_id != null ? String(item.branch_id) : null,
        branchName: item.branch_name || null,
        simId: hasSimLink ? String(item.sim_id || '') || null : null,
        simIccid: item.sim_iccid || null,
        assignedAt: mappedAssignedAt,
        createdAt: asDate(item.created_at),
    };
}
export function mapPlan(item) {
    const id = item.id ?? item.plan_id;
    const durationDays = Number(item.duration_days) || 0;
    const rawDataLimit = String(item.data_limit || '').trim();
    const dataLimit = rawDataLimit.length > 0 ? rawDataLimit : 'unlimited';
    return {
        id: id ? String(id) : '',
        name: item.name,
        description: `${durationDays} day plan`,
        price: Number(item.price) || 0,
        durationDays,
        dataLimit,
        voiceLimit: 'Included',
        active: true,
    };
}
export function mapUser(item) {
    const id = item.id ?? item.user_id;
    return {
        id: id ? String(id) : '',
        name: item.username,
        email: `${item.username}@sim.local`,
        role: resolveFrontendUserRole(item),
        branchId: item.branch_id != null ? String(item.branch_id) : null,
        branchName: item.branch_name || null,
        avatar: resolveAvatar(item, id),
        createdAt: asDate(item.created_at),
    };
}
export function toBackendRole(role) {
    if (role === 'admin')
        return 'admin';
    if (role === 'manager')
        return 'manager';
    if (role === 'operator')
        return 'operator';
    if (role === 'viewer')
        return 'viewer';
    return 'viewer';
}
export function mapCustomer(item) {
    return {
        id: String(item.id ?? item.customer_id),
        name: item.full_name,
        email: `${String(item.full_name).toLowerCase().replace(/\s+/g, '.')}@sim.local`,
        phone: item.phone || '-',
        address: '-',
        idNumber: item.id_number || '-',
        createdAt: asDate(item.created_at),
    };
}
export function mapTransaction(item) {
    const transactionId = item.id ?? item.transaction_id;
    const rawType = String(item.transaction_type || item.type || 'sale').toLowerCase();
    return {
        id: String(transactionId),
        simId: item.sim_id ? String(item.sim_id) : '',
        simIccid: item.sim_iccid || '-',
        msisdn: item.msisdn || null,
        customerId: item.customer_id ? String(item.customer_id) : null,
        customerName: item.customer_name || null,
        planId: item.plan_id ? String(item.plan_id) : null,
        planName: item.plan_name || null,
        type: rawType,
        date: asDate(item.transaction_date || item.created_at),
        userId: item.user_id ? String(item.user_id) : '0',
        userName: item.user_name || 'System',
        status: (item.status === 'failed' || item.status === 'pending' ? item.status : 'completed'),
        notes: rawType || 'Transaction',
    };
}
