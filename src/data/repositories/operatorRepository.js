import { backendApi } from '@/data/services/backendApi';
import { addBalanceToSim, assignPlanToSim } from '@/data/services/backendApi/sim';

export const operatorRepository = {
  async getInitialData() {
    return backendApi.getInitialData();
  },

  async topUpSim(params) {
    return addBalanceToSim(params);
  },

  async changeSimPlan(params) {
    return assignPlanToSim(params);
  },
};

