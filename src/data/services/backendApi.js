import { login, logout } from './backendApi/auth';
import { createBranch } from './backendApi/branch';
import { getOperatorPerformance, getPlanRevenue, getRevenues, getRevenueSummary } from './backendApi/dashboard';
import { createCustomer, deleteCustomer, updateCustomer } from './backendApi/customer';
import { getInitialData } from './backendApi/initialData';
import { createMsisdn, createMsisdnWithBranch, deleteMsisdn, importMsisdnFromExcel, updateMsisdn } from './backendApi/msisdn';
import { sendTestNotification } from './backendApi/notification';
import { createPlan, deletePlan, updatePlan } from './backendApi/plan';
import { assignSale, createSim, deactivateSim, deleteSim, getSimLifecycleHistory, importSimsFromExcel, reactivateSim, updateSim } from './backendApi/sim';
import { createUser, deleteUser, updateUser } from './backendApi/user';
export { mapSim } from './backendApi/mappers';
export const backendApi = {
    login,
    logout,
    getInitialData,
    getOperatorPerformance,
    getPlanRevenue,
    getRevenues,
    getRevenueSummary,
    createSim,
    importSimsFromExcel,
    getSimLifecycleHistory,
    updateSim,
    deleteSim,
    deactivateSim,
    reactivateSim,
    createMsisdn,
    createMsisdnWithBranch,
    importMsisdnFromExcel,
    updateMsisdn,
    deleteMsisdn,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createPlan,
    updatePlan,
    deletePlan,
    assignSale,
    sendTestNotification,
    createUser,
    updateUser,
    deleteUser,
    createBranch,
};
