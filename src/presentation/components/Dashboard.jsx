import { CreditCard, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { SIMTable } from './SIMTable';
export function Dashboard({ stats, recentSIMs, userRole, onEditSIM, onDeleteSIM, onAddSIM, onSellSIM }) {
    return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total SIMs" value={stats.totalSIMs} icon={CreditCard} accentColor="blue"/>
        <StatsCard title="Active SIMs" value={stats.activeSIMs} icon={CheckCircle2} accentColor="green"/>
        <StatsCard title="Deactivated SIMs" value={stats.deactivatedSIMs ?? stats.pendingSIMs ?? 0} icon={Clock} accentColor="amber"/>
        <StatsCard title="Suspended SIMs" value={stats.suspendedSIMs} icon={AlertCircle} accentColor="red"/>
        <StatsCard title="Inactive (Stock)" value={stats.inactiveSIMs} icon={Package} accentColor="blue"/>
      </div>

      {/* Recent SIMs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Recent SIM Cards</h2>
          <button onClick={() => onAddSIM()} className="text-sm text-[#5b93ff] hover:text-[#5b93ff]/80 transition-colors">
            View All
          </button>
        </div>
        <SIMTable sims={recentSIMs} userRole={userRole} onEdit={onEditSIM} onDelete={onDeleteSIM} onAdd={onAddSIM} onSell={onSellSIM}/>
      </div>
    </div>);
}
