import { useMemo } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { StatsCard } from '@/presentation/views/components/common/StatsCard';
import { ReportPanel } from '@/presentation/views/dashboard/admin/Report';

export function DashboardView({ stats, userRole, operatorPerformance = [], onOpenBranchDetail }) {
  const canViewOperatorPerformance = userRole === 'admin';

  const branchPerformance = useMemo(() => {
    const grouped = operatorPerformance.reduce((acc, item) => {
      const branchName = item.branch_name || 'No Branch';
      if (!acc[branchName]) {
        acc[branchName] = {
          branchId: item.branch_id ?? null,
          branchName,
          operators: 0,
          simSold: 0,
          revenue: 0,
          actions: 0,
          lastActivityAt: null,
        };
      }

      const target = acc[branchName];
      target.operators += 1;
      target.simSold += Number(item.sim_sales_count || 0);
      target.revenue += Number(item.sim_sales_amount || 0);
      target.actions += Number(item.total_system_actions || 0);

      const activityTime = item.last_activity_at ? new Date(item.last_activity_at).getTime() : 0;
      const currentTime = target.lastActivityAt ? new Date(target.lastActivityAt).getTime() : 0;
      if (activityTime > currentTime) {
        target.lastActivityAt = item.last_activity_at;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((first, second) => second.simSold - first.simSold);
  }, [operatorPerformance]);

    return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total SIMs" value={stats.totalSIMs} icon={CreditCard} accentColor="blue"/>
        <StatsCard title="Active SIMs" value={stats.activeSIMs} icon={CheckCircle2} accentColor="green"/>
        <StatsCard title="Deactivated SIMs" value={stats.deactivatedSIMs ?? stats.pendingSIMs ?? 0} icon={Clock} accentColor="amber"/>
        <StatsCard title="Suspended SIMs" value={stats.suspendedSIMs} icon={AlertCircle} accentColor="red"/>
        <StatsCard title="Inactive (Stock)" value={stats.inactiveSIMs} icon={Package} accentColor="blue"/>
      </div>

      {canViewOperatorPerformance && (<div className="bg-white border border-[#f3f3f3] rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-[#f3f3f3]">
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Branch Performance</h2>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f3f3f3]">
                      <th className="text-left py-2 pr-4 text-[#828282] font-medium">Branch</th>
                      <th className="text-left py-2 pr-4 text-[#828282] font-medium">Operators</th>
                      <th className="text-left py-2 pr-4 text-[#828282] font-medium">SIM Sold</th>
                      <th className="text-left py-2 pr-4 text-[#828282] font-medium">Revenue</th>
                      <th className="text-left py-2 text-[#828282] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchPerformance.length === 0 ? (<tr>
                        <td colSpan={5} className="py-8 text-center text-[#828282]">No branch performance data available</td>
                      </tr>) : (branchPerformance.map((branch) => (<tr key={branch.branchName} className="cursor-pointer border-b border-[#f9f9f9] transition-colors hover:bg-[#fafafa] last:border-0" onClick={() => onOpenBranchDetail?.(branch.branchName)}>
                          <td className="py-2 pr-4 text-[#1f1f1f] font-medium">{branch.branchName}</td>
                          <td className="py-2 pr-4 text-[#1f1f1f]">{branch.operators}</td>
                          <td className="py-2 pr-4 text-[#1f1f1f]">{branch.simSold}</td>
                          <td className="py-2 pr-4 text-[#1f1f1f]">${branch.revenue.toFixed(2)}</td>
                          <td className="py-2 text-[#1f1f1f]">{branch.actions}</td>
                        </tr>)))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>)}

      {canViewOperatorPerformance && (
        <ReportPanel
          branchPerformance={branchPerformance}
          operatorPerformance={operatorPerformance}
        />
      )}
    </div>);
}

