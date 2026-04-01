import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { backendApi } from '@/data/services/backendApi';
import { isAuthExpiredError } from '@/data/services/backendApi/client';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
export function useSIMManagementViewModel({ userName, isAuthenticated, authToken, userRole = null, userBranchId = null, }) {
    const [sims, setSims] = useState([]);
    const [msisdns, setMsisdns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [operatorPerformance, setOperatorPerformance] = useState([]);
    const [totals, setTotals] = useState({
        totalSIMs: null,
        activeSIMs: null,
        pendingSIMs: null,
        suspendedSIMs: null,
        inactiveSIMs: null,
        totalMSISDNs: null,
        availableMSISDNs: null,
        totalCustomers: null,
        totalTransactions: null,
    });
    const [isSIMModalOpen, setIsSIMModalOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [editingSIM, setEditingSIM] = useState(null);
    const [sellingSIM, setSellingSIM] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const reloadData = () => {
        setRefreshKey((previous) => previous + 1);
    };
    useEffect(() => {
        if (!isAuthenticated || !authToken) {
            setSims([]);
            setMsisdns([]);
            setCustomers([]);
            setPlans([]);
            setTransactions([]);
            setOperatorPerformance([]);
            setTotals({
                totalSIMs: null,
                activeSIMs: null,
                pendingSIMs: null,
                suspendedSIMs: null,
                inactiveSIMs: null,
                totalMSISDNs: null,
                availableMSISDNs: null,
                totalCustomers: null,
                totalTransactions: null,
            });
            return;
        }

        const loadData = async () => {
            try {
                const isManagerScoped = userRole === 'manager' && userBranchId != null;
                const normalizedBranchId = userBranchId != null ? String(userBranchId) : null;
                const [initialDataResult, operatorPerformanceResult, totalSimsRes, activeSimsRes, pendingSimsRes, suspendedSimsRes, inactiveSimsRes, totalMsisdnsRes, availableMsisdnsRes, totalCustomersRes, totalTransactionsRes] = await Promise.allSettled([
                    backendApi.getInitialData(),
                    backendApi.getOperatorPerformance(),
                    apiRequestWithMeta(`${ENDPOINTS.sims.list}?page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.sims.list}?status=active&page=1&pageSize=1`),
                    Promise.resolve({ pagination: { totalRecords: 0 } }),
                    apiRequestWithMeta(`${ENDPOINTS.sims.list}?status=suspended&page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.sims.list}?status=inactive&page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.numberPool.list}?page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.numberPool.list}?status=available&page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.customers.list}?page=1&pageSize=1`),
                    apiRequestWithMeta(`${ENDPOINTS.transactions.list}?page=1&pageSize=1`),
                ]);
                if (initialDataResult.status !== 'fulfilled') {
                    throw initialDataResult.reason;
                }
                const initialData = initialDataResult.value;
                const scopedSims = isManagerScoped
                    ? initialData.sims.filter((sim) => sim.branchId != null && String(sim.branchId) === normalizedBranchId)
                    : initialData.sims;
                const scopedMsisdns = initialData.msisdns;

                setSims(scopedSims);
                setMsisdns(scopedMsisdns);
                setCustomers(initialData.customers);
                setPlans(initialData.plans);
                setTransactions(initialData.transactions);

                if (operatorPerformanceResult.status === 'fulfilled') {
                    setOperatorPerformance(operatorPerformanceResult.value || []);
                }
                else {
                    setOperatorPerformance([]);
                }

                if (isManagerScoped) {
                    setTotals({
                        totalSIMs: null,
                        activeSIMs: null,
                        pendingSIMs: null,
                        suspendedSIMs: null,
                        inactiveSIMs: null,
                        totalMSISDNs: null,
                        availableMSISDNs: null,
                        totalCustomers: null,
                        totalTransactions: null,
                    });
                }
                else {
                    setTotals({
                        totalSIMs: totalSimsRes.status === 'fulfilled' ? totalSimsRes.value?.pagination?.totalRecords ?? null : null,
                        activeSIMs: activeSimsRes.status === 'fulfilled' ? activeSimsRes.value?.pagination?.totalRecords ?? null : null,
                        pendingSIMs: pendingSimsRes.status === 'fulfilled' ? pendingSimsRes.value?.pagination?.totalRecords ?? null : null,
                        suspendedSIMs: suspendedSimsRes.status === 'fulfilled' ? suspendedSimsRes.value?.pagination?.totalRecords ?? null : null,
                        inactiveSIMs: inactiveSimsRes.status === 'fulfilled' ? inactiveSimsRes.value?.pagination?.totalRecords ?? null : null,
                        totalMSISDNs: totalMsisdnsRes.status === 'fulfilled' ? totalMsisdnsRes.value?.pagination?.totalRecords ?? null : null,
                        availableMSISDNs: availableMsisdnsRes.status === 'fulfilled' ? availableMsisdnsRes.value?.pagination?.totalRecords ?? null : null,
                        totalCustomers: totalCustomersRes.status === 'fulfilled' ? totalCustomersRes.value?.pagination?.totalRecords ?? null : null,
                        totalTransactions: totalTransactionsRes.status === 'fulfilled' ? totalTransactionsRes.value?.pagination?.totalRecords ?? null : null,
                    });
                }
            }
            catch (error) {
                if (isAuthExpiredError(error)) {
                    return;
                }
                toast.error(error instanceof Error ? error.message : 'Failed to load data from backend');
            }
        };
        loadData();
    }, [isAuthenticated, authToken, userRole, userBranchId, refreshKey]);
    // Calculate stats
    const stats = useMemo(() => ({
        totalSIMs: totals.totalSIMs ?? sims.length,
        activeSIMs: totals.activeSIMs ?? sims.filter(s => s.status === 'active').length,
        pendingSIMs: totals.pendingSIMs ?? sims.filter(s => s.status === 'pending').length,
        suspendedSIMs: totals.suspendedSIMs ?? sims.filter(s => s.status === 'suspended').length,
        inactiveSIMs: totals.inactiveSIMs ?? sims.filter(s => s.status === 'inactive').length,
        totalMSISDNs: totals.totalMSISDNs ?? msisdns.length,
        availableMSISDNs: totals.availableMSISDNs ?? msisdns.filter(m => m.status === 'available').length,
        totalCustomers: totals.totalCustomers ?? customers.length,
        totalTransactions: totals.totalTransactions ?? transactions.length,
    }), [sims, msisdns, customers, transactions, totals]);
    // Get recent SIMs (last 5)
    const recentSIMs = useMemo(() => {
        return [...sims].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
    }, [sims]);
    // Get available MSISDNs
    const availableMSISDNs = useMemo(() => {
        return msisdns.filter(m => m.status === 'available');
    }, [msisdns]);
    // ========== SIM Handlers ==========
    const handleAddSIM = async (simData) => {
        try {
            const created = await backendApi.createSim(simData);
            setSims(prev => [created, ...prev]);
            reloadData();
            toast.success('SIM card added to inventory');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add SIM card');
            return false;
        }
    };
    const handleEditSIM = async (simData) => {
        if (!editingSIM)
            return false;
        try {
            const updated = await backendApi.updateSim(editingSIM.id, {
                ...editingSIM,
                ...simData,
            });
            setSims(prev => prev.map(sim => (sim.id === editingSIM.id ? updated : sim)));
            if (simData.status && simData.status !== editingSIM.status) {
                const newTransaction = {
                    id: Date.now().toString(),
                    simId: editingSIM.id,
                    simIccid: editingSIM.iccid,
                    msisdn: editingSIM.msisdn,
                    customerId: editingSIM.customerId,
                    customerName: editingSIM.assignedTo,
                    planId: editingSIM.planId,
                    planName: null,
                    type: simData.status === 'suspended' ? 'suspension' : simData.status === 'active' ? 'activation' : 'deactivation',
                    date: new Date(),
                    userId: '1',
                    userName: userName,
                    status: 'completed',
                    notes: `Status changed from ${editingSIM.status} to ${simData.status}`,
                };
                setTransactions(prev => [newTransaction, ...prev]);
            }
            toast.success('SIM card updated successfully');
            setEditingSIM(null);
            reloadData();
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update SIM card');
            return false;
        }
    };
    const handleImportSIMBatch = async (params) => {
        try {
            const summary = await backendApi.importSimsFromExcel(params);
            reloadData();
            toast.success(`Import complete: ${summary.inserted || 0} inserted, ${summary.skipped || 0} skipped`);
            return summary;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to import SIM Excel batch');
            return false;
        }
    };
    const handleDeleteSIM = async (id) => {
        try {
            const sim = sims.find(s => s.id === id);
            await backendApi.deleteSim(id);
            if (sim?.msisdn) {
                setMsisdns(prev => prev.map(m => m.number === sim.msisdn
                    ? { ...m, status: 'available', simId: null, simIccid: null, assignedAt: null }
                    : m));
            }
            setSims(prev => prev.filter(sim => sim.id !== id));
            reloadData();
            toast.success('SIM card deleted successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete SIM card');
            return false;
        }
    };
    const handleBulkUpdateSIMStatus = async (simIds, status) => {
        try {
            await Promise.all(simIds.map((id) => backendApi.updateSim(id, { status })));
            setSims((prev) => prev.map((sim) => simIds.includes(sim.id)
                ? { ...sim, status, updatedAt: new Date() }
                : sim));
            reloadData();
            toast.success(`Updated ${simIds.length} SIM(s)`);
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update selected SIMs');
            return false;
        }
    };
    const handleBulkUpdateSIMBranch = async (simIds, branchId) => {
        try {
            await Promise.all(simIds.map((id) => backendApi.updateSim(id, { branchId })));
            setSims((prev) => prev.map((sim) => simIds.includes(sim.id)
                ? { ...sim, branchId: branchId ? String(branchId) : null, branchName: null, updatedAt: new Date() }
                : sim));
            reloadData();
            toast.success(`Updated branch for ${simIds.length} SIM(s)`);
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update branch for selected SIMs');
            return false;
        }
    };
    const handleBulkDeleteSIMs = async (simIds) => {
        try {
            await Promise.all(simIds.map((id) => backendApi.deleteSim(id)));
            setSims((prev) => prev.filter((sim) => !simIds.includes(sim.id)));
            reloadData();
            toast.success(`Deleted ${simIds.length} SIM(s)`);
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete selected SIMs');
            return false;
        }
    };
    const handleAddPlan = async (planData) => {
        try {
            const created = await backendApi.createPlan(planData);
            setPlans((prev) => [created, ...prev]);
            reloadData();
            toast.success('Plan added successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add plan');
            return false;
        }
    };
    const handleEditPlan = async (planId, planData) => {
        try {
            const updated = await backendApi.updatePlan(planId, planData);
            setPlans((prev) => prev.map((plan) => (plan.id === planId ? updated : plan)));
            reloadData();
            toast.success('Plan updated successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update plan');
            return false;
        }
    };
    const handleDeletePlan = async (planId) => {
        try {
            await backendApi.deletePlan(planId);
            setPlans((prev) => prev.filter((plan) => plan.id !== planId));
            reloadData();
            toast.success('Plan deleted successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete plan');
            return false;
        }
    };
    const handleAddCustomer = async (customerData) => {
        try {
            const created = await backendApi.createCustomer(customerData);
            setCustomers((prev) => [created, ...prev]);
            reloadData();
            toast.success('Customer added successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add customer');
            return false;
        }
    };
    const handleEditCustomer = async (customerData) => {
        try {
            const updated = await backendApi.updateCustomer(customerData.id, customerData);
            setCustomers((prev) => prev.map((customer) => (customer.id === updated.id ? updated : customer)));
            reloadData();
            toast.success('Customer updated successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update customer');
            return false;
        }
    };
    const handleDeleteCustomer = async (id) => {
        try {
            await backendApi.deleteCustomer(id);
            setCustomers((prev) => prev.filter((customer) => customer.id !== id));
            reloadData();
            toast.success('Customer deleted successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete customer');
            return false;
        }
    };
    const openAddSIMModal = () => {
        setEditingSIM(null);
        setIsSIMModalOpen(true);
    };
    const openEditSIMModal = (sim) => {
        setEditingSIM(sim);
        setIsSIMModalOpen(true);
    };
    const handleSellSIM = (sim) => {
        setSellingSIM(sim);
        setIsSellModalOpen(true);
    };
    const completeSale = async (saleData) => {
        const msisdn = msisdns.find(m => m.id === saleData.msisdnId);
        const plan = plans.find(p => p.id === saleData.planId);
        let customer = null;
        if (saleData.newCustomer) {
            try {
                customer = await backendApi.createCustomer(saleData.newCustomer);
                setCustomers(prev => [...prev, customer]);
            }
            catch (error) {
                if (isAuthExpiredError(error)) {
                    return false;
                }
                toast.error(error instanceof Error ? error.message : 'Failed to create customer');
                return false;
            }
        }
        else if (saleData.customerId) {
            customer = customers.find(c => c.id === saleData.customerId) || null;
        }
        if (!msisdn || !plan || !customer) {
            toast.error('Missing required information');
            return false;
        }
        try {
            await backendApi.assignSale({
                simId: saleData.simId,
                simIccid: sellingSIM?.iccid || '',
                msisdnId: saleData.msisdnId,
                msisdnNumber: msisdn.number,
                customerId: customer.id,
                planId: plan.id,
                amount: plan.price,
            });
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to process SIM sale');
            return false;
        }
        setMsisdns(prev => prev.map(m => m.id === saleData.msisdnId
            ? {
                ...m,
                status: 'assigned',
                simId: saleData.simId,
                simIccid: sellingSIM?.iccid || null,
                assignedAt: new Date()
            }
            : m));
        setSims(prev => prev.map(sim => sim.id === saleData.simId
            ? {
                ...sim,
                msisdn: msisdn.number,
                status: 'active',
                customerId: customer.id,
                planId: plan.id,
                assignedTo: customer.name,
                updatedAt: new Date()
            }
            : sim));
        const newTransaction = {
            id: Date.now().toString(),
            simId: saleData.simId,
            simIccid: sellingSIM?.iccid || '',
            msisdn: msisdn.number,
            customerId: customer.id,
            customerName: customer.name,
            planId: plan.id,
            planName: plan.name,
            type: 'sale',
            date: new Date(),
            userId: '1',
            userName: userName,
            status: 'completed',
            notes: `Sold to ${customer.name} with ${plan.name}`,
        };
        setTransactions(prev => [newTransaction, ...prev]);
        reloadData();
        toast.success(`SIM sold successfully to ${customer.name}!`);
        setSellingSIM(null);
        return true;
    };
    return {
        sims,
        msisdns,
        setMsisdns,
        customers,
        plans,
        setPlans,
        transactions,
        operatorPerformance,
        stats,
        recentSIMs,
        availableMSISDNs,
        isSIMModalOpen,
        setIsSIMModalOpen,
        isSellModalOpen,
        setIsSellModalOpen,
        editingSIM,
        setEditingSIM,
        sellingSIM,
        setSellingSIM,
        reloadData,
        handleAddSIM,
        handleImportSIMBatch,
        handleEditSIM,
        handleDeleteSIM,
        handleBulkUpdateSIMStatus,
        handleBulkUpdateSIMBranch,
        handleBulkDeleteSIMs,
        handleAddPlan,
        handleEditPlan,
        handleDeletePlan,
        handleAddCustomer,
        handleEditCustomer,
        handleDeleteCustomer,
        openAddSIMModal,
        openEditSIMModal,
        handleSellSIM,
        completeSale,
    };
}

