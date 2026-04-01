const normalizeId = (value) => String(value ?? '').trim();

export async function refreshOperatorDashboardData(repository, { simIdToUpdate = null, selectedCustomerSim, setLocalCustomers, setLocalSims, setLocalTransactions, setSelectedCustomerSim }) {
  const latestData = await repository.getInitialData();

  setLocalCustomers(latestData?.customers || []);
  setLocalSims(latestData?.sims || []);
  setLocalTransactions(latestData?.transactions || []);

  if (simIdToUpdate && selectedCustomerSim) {
    const updatedSim = (latestData?.sims || []).find((sim) => normalizeId(sim.id) === normalizeId(simIdToUpdate));
    if (updatedSim) {
      setSelectedCustomerSim(updatedSim);
    }
  }
}

export async function executeQuickTopUp(repository, { userId, branchId, localSims, customerId, simId, amount }) {
  const targetSim = (localSims || []).find((sim) => normalizeId(sim.id) === normalizeId(simId));
  const effectiveBranchId = branchId || targetSim?.branchId;

  if (!userId || !effectiveBranchId) {
    throw new Error('Missing user or branch context for top up');
  }

  await repository.topUpSim({
    userId,
    branchId: effectiveBranchId,
    customerId,
    simId,
    amount,
  });
}

export async function executeQuickChangePlan(repository, { userId, simId, planId }) {
  await repository.changeSimPlan({
    simId,
    planId,
    assignedBy: userId,
  });
}
