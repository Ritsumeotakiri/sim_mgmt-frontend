import { useState, useMemo } from 'react';
import { CreditCard, TrendingUp, Users, Phone, Plus, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { StatsCard } from '../../../components/common/StatsCard';
import { SIMTable } from '../../../components/sim/SIMTable';
import { MSISDNInventory } from '../../../components/msisdn/MSISDNInventory';
import { TransactionsTable } from '../../../components/transaction/TransactionsTable';
import { SIMFormModal } from '../../../components/sim/SIMFormModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
export function ManagerDashboard({ sims, msisdns, transactions, users, currentUserBranchId = null, stats: aggregateStats, onAddSIM, onEditSIM, onBatchImportSIM }) {
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
      pendingSIMs: aggregateStats?.pendingSIMs ?? sims.filter(s => s.status === 'pending').length,
      suspendedSIMs: aggregateStats?.suspendedSIMs ?? sims.filter(s => s.status === 'suspended').length,
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
    return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total SIMs" value={stats.totalSIMs} icon={CreditCard} accentColor="blue"/>
        <StatsCard title="Active SIMs" value={stats.activeSIMs} icon={CheckCircle2} accentColor="green"/>
        <StatsCard title="Pending" value={stats.pendingSIMs} icon={Clock} accentColor="amber"/>
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
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f6a94c]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#f6a94c]"/>
            </div>
            <div>
              <p className="text-sm text-[#828282]">Total Transactions</p>
              <p className="text-xl font-semibold text-[#1f1f1f]">{stats.totalTransactions}</p>
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
        <div className="border-b border-[#f3f3f3]">
          <div className="flex flex-wrap">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              Overview
            </button>
            <button onClick={() => setActiveTab('sims')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sims'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              SIM Cards
            </button>
            <button onClick={() => setActiveTab('msisdns')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'msisdns'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              MSISDNs
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              Transactions
            </button>
            <button onClick={() => setActiveTab('team')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'team'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              Team
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'overview' && (<div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button onClick={handleAddSIM} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                  <Plus className="w-4 h-4 mr-2"/>
                  Add SIM
                </Button>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="font-semibold text-[#1f1f1f] mb-4">Recent Transactions</h3>
                <TransactionsTable transactions={transactions} useServerPagination={true}/>
              </div>
            </div>)}

          {activeTab === 'sims' && (<div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[#1f1f1f]">All SIM Cards</h3>
                <Button onClick={handleAddSIM} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                  <Plus className="w-4 h-4 mr-2"/>
                  Add SIM
                </Button>
              </div>
              <SIMTable sims={sims} userRole="manager" onEdit={handleEditSIM} onDelete={() => toast.error('Managers cannot delete SIMs. Contact an admin.')} onAdd={handleAddSIM}/>
            </div>)}

          {activeTab === 'msisdns' && (<div className="space-y-4">
              <div className="bg-[#f6a94c]/10 border border-[#f6a94c]/20 rounded-lg p-4">
                <p className="text-sm text-[#f6a94c]">
                  <strong>Read-only view:</strong> Only administrators can manage the MSISDN inventory.
                </p>
              </div>
              <MSISDNInventory msisdns={msisdns}/>
            </div>)}

          {activeTab === 'transactions' && (<TransactionsTable transactions={transactions} useServerPagination={true}/>)}

          {activeTab === 'team' && (<div className="space-y-4">
              <h3 className="font-semibold text-[#1f1f1f]">Team Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scopedTeamUsers.map((user) => (<button key={user.id} type="button" onClick={() => setSelectedTeamMember(user)} className="w-full text-left bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5 hover:border-[#5b93ff] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-[#f3f3f3]"/>
                      <div>
                        <h4 className="font-medium text-[#1f1f1f]">{user.name}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-[#e9423a]/10 text-[#e9423a]' :
                    user.role === 'manager' ? 'bg-[#5b93ff]/10 text-[#5b93ff]' :
                        user.role === 'operator' ? 'bg-[#3ebb7f]/10 text-[#3ebb7f]' :
                            'bg-[#828282]/10 text-[#828282]'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#f3f3f3]">
                      <p className="text-sm text-[#828282]">{user.email}</p>
                      <p className="text-xs text-[#828282] mt-1">{user.branchName || 'No branch'}</p>
                      <p className="text-xs text-[#c9c7c7] mt-1">
                        Joined {user.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </button>))}
                {scopedTeamUsers.length === 0 && (<div className="col-span-full rounded-lg border border-[#f3f3f3] p-6 text-sm text-[#828282] text-center">No team members found in your branch.</div>)}
              </div>
            </div>)}
        </div>
      </div>

      <Dialog open={Boolean(selectedTeamMember)} onOpenChange={(isOpen) => {
            if (!isOpen)
                setSelectedTeamMember(null);
        }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Member Info & Performance</DialogTitle>
          </DialogHeader>
          {selectedTeamMember && (<div className="space-y-5">
              <div className="flex items-center gap-3">
                <img src={selectedTeamMember.avatar} alt={selectedTeamMember.name} className="w-14 h-14 rounded-full bg-[#f3f3f3]"/>
                <div>
                  <h4 className="font-semibold text-[#1f1f1f]">{selectedTeamMember.name}</h4>
                  <p className="text-sm text-[#828282]">{selectedTeamMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Role</p>
                  <p className="text-sm font-medium text-[#1f1f1f] capitalize">{selectedTeamMember.role}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Joined</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedTeamMember.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Sales</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.salesCount || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Total Transactions</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.totalTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Completed</p>
                  <p className="text-base font-semibold text-[#3ebb7f]">{teamPerformanceByUserName[selectedTeamMember.name]?.completedTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Pending/Failed</p>
                  <p className="text-base font-semibold text-[#f6a94c]">{(teamPerformanceByUserName[selectedTeamMember.name]?.pendingTransactions || 0) +
                    (teamPerformanceByUserName[selectedTeamMember.name]?.failedTransactions || 0)}</p>
                </div>
              </div>

              <div className="bg-white border border-[#f3f3f3] rounded-lg p-3">
                <p className="text-xs text-[#828282]">Last Activity</p>
                <p className="text-sm font-medium text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.lastActivity
                    ? teamPerformanceByUserName[selectedTeamMember.name].lastActivity.toLocaleString()
                    : 'No activity yet'}</p>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {/* SIM Form Modal */}
      <SIMFormModal isOpen={isSIMModalOpen} onClose={() => {
            setIsSIMModalOpen(false);
            setEditingSIM(null);
        }} onSave={handleSaveSIM} onBatchImport={onBatchImportSIM} sim={editingSIM}/>
    </div>);
}
