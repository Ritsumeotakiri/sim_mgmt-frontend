import { CreditCard, TrendingUp, Users, Phone, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { StatsCard } from '@/presentation/views/components/common/StatsCard';
import { SIMFormModal } from '@/presentation/views/components/sim/SIMFormModal';
import { useNavigate } from 'react-router-dom';
import useManagerDashboard from './useManagerDashboard';
import OverviewTab from './tabs/OverviewTab';
import SIMsTab from './tabs/SIMsTab';
import MSISDNsTab from './tabs/MSISDNsTab';
import TransactionsTab from './tabs/TransactionsTab';
import TeamTab from './tabs/TeamTab';
import { OperatorDashboardView } from '@/presentation/views/operator/OperatorDashboardView';
import { TabNavigationView } from '@/presentation/views/operator/components/TabNavigationView';
import useManagerTabOrder from '@/presentation/viewModels/manager/hooks/useTabOrder';

const MANAGER_TAB_LABELS = {
  overview: 'Overview',
  sims: 'SIM Cards',
  msisdns: 'MSISDNs',
  transactions: 'Transactions',
  operator: 'Operator',
  team: 'Team',
};

export function ManagerDashboardView({ sims, msisdns, transactions, users, currentUserBranchId = null, stats: aggregateStats, onAddSIM, onEditSIM, onBatchImportSIM, customers = [], plans = [], onSellSIM, onAddCustomer, userId = null, branchId = null }) {
  const {
    activeTab,
    setActiveTab,
    isSIMModalOpen,
    setIsSIMModalOpen,
    editingSIM,
    selectedTeamMember,
    setSelectedTeamMember,
    scopedTeamUsers,
    stats,
    teamPerformanceByUserName,
    handleEditSIM,
    handleSaveSIM,
  } = useManagerDashboard({ sims, msisdns, transactions, users, currentUserBranchId, stats: aggregateStats, onAddSIM, onEditSIM, onBatchImportSIM });

  const navigate = useNavigate();

  // Team dialog shows member info and performance inline; no manager-only operator state required here

  function TabNavigationWrapper({ activeTab, setActiveTab }) {
    const settingKey = userId ? `manager-dashboard-tab-order-v1:${userId}` : undefined;
    const { tabOrder, draggedTab, setDraggedTab, onDropTab } = useManagerTabOrder(settingKey);
    return (
      <TabNavigationView
        tabOrder={tabOrder}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        draggedTab={draggedTab}
        setDraggedTab={setDraggedTab}
        onDropTab={onDropTab}
        labels={MANAGER_TAB_LABELS}
      />
    );
  }

  return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total SIMs" value={stats.totalSIMs} icon={CreditCard} accentColor="blue"/>
        <StatsCard title="Active SIMs" value={stats.activeSIMs} icon={CheckCircle2} accentColor="green"/>
        <StatsCard title="Deactivated" value={stats.deactivatedSIMs} icon={Clock} accentColor="amber"/>
        <StatsCard title="Suspended" value={stats.suspendedSIMs} icon={AlertCircle} accentColor="red"/>
        <StatsCard title="In Stock" value={stats.inactiveSIMs} icon={Package} accentColor="blue"/>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3ebb7f]/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#3ebb7f]"/>
            </div>
            <div>
              <p className="text-sm text-[#828282]">MSISDNs Available</p>
              <p className="text-xl font-semibold text-[#1f1f1f]">{stats.availableMSISDNs} / {stats.totalMSISDNs}</p>
            </div>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          aria-label="Open transactions"
          onClick={() => navigate('/transactions')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); navigate('/transactions'); } }}
          className="bg-white rounded-xl p-5 border border-[#f3f3f3] shadow-sm cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f6a94c]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#f6a94c]"/>
            </div>
            <div>
              {/* <p className="text-sm text-[#828282]">Total Transactions</p> */}
              <p className="text-sm text-[#000000]">See transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5b93ff]/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#5b93ff]"/>
            </div>
            <div>
              <p className="text-sm text-[#828282]">Team Size</p>
              <p className="text-xl font-semibold text-[#1f1f1f]">{stats.teamSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
        {/* use manager-specific tab order hook and shared TabNavigationView (labels passed) */}
        <TabNavigationWrapper
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="p-5">
          {activeTab === 'overview' && <OverviewTab transactions={transactions} />}
          {activeTab === 'sims' && <SIMsTab sims={sims} handleEditSIM={handleEditSIM} />}
          {activeTab === 'msisdns' && <MSISDNsTab msisdns={msisdns} />}
          {activeTab === 'transactions' && <TransactionsTab transactions={transactions} />}
          {activeTab === 'operator' && (
            <div className="manager-embedded-operator">
              <style>{`.manager-embedded-operator .border-b { display: none; }`}</style>
              <OperatorDashboardView
                sims={sims}
                msisdns={msisdns}
                customers={customers}
                plans={plans}
                transactions={transactions}
                onSellSIM={onSellSIM}
                onAddCustomer={onAddCustomer}
                userId={userId}
                branchId={branchId}
              />
            </div>
          )}
          {activeTab === 'team' && <TeamTab scopedTeamUsers={scopedTeamUsers} selectedTeamMember={selectedTeamMember} setSelectedTeamMember={setSelectedTeamMember} teamPerformanceByUserName={teamPerformanceByUserName} transactions={transactions} sims={sims} customers={customers} />}
        </div>
      </div>

      {/* SIM Form Modal */}
      <SIMFormModal isOpen={isSIMModalOpen} onClose={() => {
            setIsSIMModalOpen(false);
            // editingSIM is managed in the hook; setEditingSIM not exported here so just clear via onClose behavior
        }} onSave={handleSaveSIM} onBatchImport={onBatchImportSIM} sim={editingSIM}/>
    </div>);
}


