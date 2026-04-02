import { useCallback, useState } from 'react';
import { operatorRepository } from '@/data/repositories/operatorRepository';
import { executeQuickChangePlan, executeQuickTopUp, refreshOperatorDashboardData } from '@/domain/usecases/operatorActions';

export function useOperatorActionsViewModel({
  userId,
  branchId,
  localSims,
  onSellSIM,
  onReactivateSIM,
  selectedCustomerSim,
  setSelectedCustomerSim,
  setLocalCustomers,
  setLocalSims,
  setLocalTransactions,
  setIsSellModalOpen,
  setSellingSIM,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async (simIdToUpdate = null) => {
    setIsRefreshing(true);
    try {
      await refreshOperatorDashboardData(operatorRepository, {
        simIdToUpdate,
        selectedCustomerSim,
        setLocalCustomers,
        setLocalSims,
        setLocalTransactions,
        setSelectedCustomerSim,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCustomerSim, setLocalCustomers, setLocalSims, setLocalTransactions, setSelectedCustomerSim]);

  const handleCompleteSale = useCallback(async (saleData) => {
    const success = await onSellSIM(saleData);
    if (success) {
      setIsSellModalOpen(false);
      setSellingSIM(null);
      await refreshData();
    }
    return Boolean(success);
  }, [onSellSIM, refreshData, setIsSellModalOpen, setSellingSIM]);

  const handleCompleteReactivation = useCallback(async (saleData) => {
    if (typeof onReactivateSIM !== 'function') {
      return false;
    }
    const success = await onReactivateSIM(saleData);
    if (success) {
      setIsSellModalOpen(false);
      setSellingSIM(null);
      await refreshData(saleData?.simId ?? null);
    }
    return Boolean(success);
  }, [onReactivateSIM, refreshData, setIsSellModalOpen, setSellingSIM]);

  const handleOpenQuickSale = useCallback(() => {
    setSellingSIM({ customerBuyFlow: true });
    setIsSellModalOpen(true);
  }, [setIsSellModalOpen, setSellingSIM]);

  const handleQuickTopUp = useCallback(async ({ customerId, simId, amount }) => {
    await executeQuickTopUp(operatorRepository, {
      userId,
      branchId,
      localSims,
      customerId,
      simId,
      amount,
    });

    await refreshData(simId);
  }, [userId, branchId, localSims, refreshData]);

  const handleQuickChangePlan = useCallback(async ({ simId, planId }) => {
    await executeQuickChangePlan(operatorRepository, {
      userId,
      simId,
      planId,
    });

    await refreshData(simId);
  }, [userId, refreshData]);

  return {
    isRefreshing,
    refreshData,
    handleCompleteSale,
    handleCompleteReactivation,
    handleOpenQuickSale,
    handleQuickTopUp,
    handleQuickChangePlan,
  };
}
