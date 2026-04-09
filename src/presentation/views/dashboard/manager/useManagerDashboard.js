import { useState, useMemo } from 'react';

export function useManagerDashboard({ sims = [], msisdns = [], transactions = [], users = [], currentUserBranchId = null, stats: aggregateStats = {}, onAddSIM, onEditSIM, onBatchImportSIM }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSIMModalOpen, setIsSIMModalOpen] = useState(false);
  const [editingSIM, setEditingSIM] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);

  const scopedTeamUsers = useMemo(() => {
    return users.filter((user) => {
      const isAdmin = user.role === 'admin';
      const sameBranch = currentUserBranchId != null
        && user.branchId != null
        && String(user.branchId) === String(currentUserBranchId);
      return !isAdmin && sameBranch;
    });
  }, [users, currentUserBranchId]);

  // Stats
  const stats = useMemo(() => ({
    totalSIMs: aggregateStats?.totalSIMs ?? sims.length,
    activeSIMs: aggregateStats?.activeSIMs ?? sims.filter(s => s.status === 'active').length,
    deactivatedSIMs: aggregateStats?.deactivatedSIMs ?? aggregateStats?.pendingSIMs ?? sims.filter(s => s.status === 'deactivate').length,
    suspendedSIMs: aggregateStats?.suspendedSIMs ?? sims.filter(s => s.status === 'suspend').length,
    inactiveSIMs: aggregateStats?.inactiveSIMs ?? sims.filter(s => s.status === 'inactive').length,
    totalMSISDNs: aggregateStats?.totalMSISDNs ?? msisdns.length,
    availableMSISDNs: aggregateStats?.availableMSISDNs ?? msisdns.filter(m => m.status === 'available').length,
    totalTransactions: aggregateStats?.totalTransactions ?? transactions.length,
    teamSize: scopedTeamUsers.length,
  }), [aggregateStats, sims, msisdns, transactions, scopedTeamUsers]);

  const teamPerformanceByUserName = useMemo(() => {
    return scopedTeamUsers.reduce((acc, user) => {
      const userTransactions = transactions.filter((transaction) => transaction.userName === user.name);
      const completedTransactions = userTransactions.filter((transaction) => transaction.status === 'completed');
      const pendingTransactions = userTransactions.filter((transaction) => transaction.status === 'pending');
      const failedTransactions = userTransactions.filter((transaction) => transaction.status === 'failed');
      const sales = userTransactions.filter((transaction) => transaction.type === 'sale');
      const lastActivity = userTransactions.length > 0
        ? [...userTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
        : null;
      acc[user.name] = {
        totalTransactions: userTransactions.length,
        completedTransactions: completedTransactions.length,
        pendingTransactions: pendingTransactions.length,
        failedTransactions: failedTransactions.length,
        salesCount: sales.length,
        lastActivity,
      };
      return acc;
    }, {});
  }, [transactions, scopedTeamUsers]);

  const handleAddSIM = () => {
    setEditingSIM(null);
    setIsSIMModalOpen(true);
  };

  const handleEditSIM = (sim) => {
    setEditingSIM(sim);
    setIsSIMModalOpen(true);
  };

  const handleSaveSIM = (simData) => {
    if (editingSIM) {
      onEditSIM(simData);
    }
    else {
      onAddSIM(simData);
    }
    setIsSIMModalOpen(false);
    setEditingSIM(null);
  };

  return {
    activeTab,
    setActiveTab,
    isSIMModalOpen,
    setIsSIMModalOpen,
    editingSIM,
    setEditingSIM,
    selectedTeamMember,
    setSelectedTeamMember,
    scopedTeamUsers,
    stats,
    teamPerformanceByUserName,
    handleAddSIM,
    handleEditSIM,
    handleSaveSIM,
    onBatchImportSIM,
  };
}

export default useManagerDashboard;
