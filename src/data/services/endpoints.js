export const ENDPOINTS = {
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',

    },
    sims: {
        list: '/sims',
        create: '/sims',
        importExcel: '/sims/import/excel',
        byId: (id) => `/sims/${id}`,
        history: (id) => `/sims/${id}/history`,
        assignPlan: (id) => `/sims/${id}/assign-plan`,
        deactivate: (id) => `/sims/${id}/deactivate`,
        reactivate: (id) => `/sims/${id}/reactivate`,

    },
    numberPool: {
        list: '/number-pool',
        create: '/number-pool',
        importExcel: '/number-pool/import/excel',
        byId: (id) => `/number-pool/${id}`,
    },
    customers: {
        list: '/customers',
        create: '/customers',
        byId: (id) => `/customers/${id}`,
    },
    plans: {
        list: '/plans',
        create: '/plans',
        byId: (id) => `/plans/${id}`,
    },
    transactions: {
        list: '/transactions',
        process: '/transactions/process',
    },
    users: {
        list: '/users',
        create: '/users',
        byId: (id) => `/users/${id}`,
        delete: (id) => `/users/${id}`,
        update: (id) => `/users/${id}`,
    },
    branches: {
        list: '/branches',
        create: '/branches',
        byId: (id) => `/branches/${id}`,
    },
    notifications: {
        test: '/notifications/test',
    },
    settings: {
        list: '/settings',
        byName: (name) => `/settings/${name}`,
        alertThresholds: (branchId) => `/settings/alert-thresholds/${branchId}`,
    },
    dashboard: {
        operatorPerformance: '/dashboard/operator-performance',
        planRevenue: '/dashboard/plan-revenue',
        planRevenueByBranch: '/dashboard/plan-revenue-by-branch',
        revenueList: '/revenue',
        revenueDetail: (id) => `/revenue/${id}`,
        revenueSummary: '/revenue/summary',
    },
    logs: {
        frontend: '/logs/frontend',
    },
};
