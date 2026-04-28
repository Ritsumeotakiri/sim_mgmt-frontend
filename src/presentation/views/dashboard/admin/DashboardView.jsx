import { useMemo } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  Users,
  Smartphone,
} from 'lucide-react';
import { ReportPanel } from '@/presentation/views/dashboard/admin/Report';

// --- Helper Components ---

const TrendIndicator = ({ value, prevValue }) => {
  if (!prevValue) return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  const diff = ((value - prevValue) / prevValue) * 100;
  if (diff > 0) return <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-0.5" />+{diff.toFixed(1)}%</span>;
  if (diff < 0) return <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><TrendingDown className="w-3 h-3 mr-0.5" />{diff.toFixed(1)}%</span>;
  return <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded"><Minus className="w-3 h-3 mr-0.5" />0%</span>;
};

const ProgressBar = ({ value, max, color = "bg-blue-500" }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    {Icon && (
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
    )}
    <p className="text-sm font-medium text-gray-500">{title}</p>
    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
  </div>
);

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

  const maxRevenue = Math.max(...branchPerformance.map(b => b.revenue), 0);
  const maxSimSold = Math.max(...branchPerformance.map(b => b.simSold), 0);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statsConfig = [
    { title: 'Total SIMs', value: stats.totalSIMs, icon: CreditCard, color: 'blue', trend: stats.totalSIMsTrend },
    { title: 'Active SIMs', value: stats.activeSIMs, icon: CheckCircle2, color: 'emerald', trend: stats.activeSIMsTrend },
    { title: 'Deactivated', value: stats.deactivatedSIMs ?? stats.pendingSIMs ?? 0, icon: Clock, color: 'amber', trend: stats.deactivatedTrend },
    { title: 'Suspended', value: stats.suspendedSIMs, icon: AlertCircle, color: 'rose', trend: stats.suspendedTrend },
    { title: 'In Stock', value: stats.inactiveSIMs, icon: Package, color: 'indigo', trend: stats.inactiveTrend },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsConfig.map((stat) => (
          <div 
            key={stat.title}
            className="group relative bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend !== undefined && (
                <TrendIndicator value={stat.value} prevValue={stat.value - stat.trend} />
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
                {new Intl.NumberFormat('en-US').format(stat.value || 0)}
              </p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${stat.color}-500 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Branch Performance */}
      {canViewOperatorPerformance && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Branch Performance</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            {branchPerformance.length === 0 ? (
              <EmptyState 
                icon={Building2}
                title="No branch data available" 
                description="Performance metrics will appear once operators start processing sales" 
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
                    <th className="px-4 py-3.5 w-12 text-center">#</th>
                    <th className="px-6 py-3.5">Branch</th>
                    <th className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Operators
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" /> SIM Sold
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-right">Revenue</th>
                    <th className="px-6 py-3.5 text-right">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {branchPerformance.map((branch, idx) => (
                    <tr 
                      key={branch.branchName} 
                      className="group cursor-pointer hover:bg-gray-50/80 transition-colors duration-150"
                      onClick={() => onOpenBranchDetail?.(branch.branchName)}
                    >
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-gray-400">{idx + 1}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {branch.branchName.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {branch.branchName}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 font-medium text-xs border border-gray-100">
                          {branch.operators}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-block text-right min-w-[80px]">
                          <span className="font-semibold text-gray-900">{branch.simSold.toLocaleString()}</span>
                          <ProgressBar value={branch.simSold} max={maxSimSold} color="bg-emerald-500" />
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-block text-right min-w-[100px]">
                          <span className="font-bold text-gray-900">{formatCurrency(branch.revenue)}</span>
                          <ProgressBar value={branch.revenue} max={maxRevenue} color="bg-blue-500" />
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-gray-500 flex items-center justify-end gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(branch.lastActivityAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Report Panel */}
      {canViewOperatorPerformance && (
        <ReportPanel
          branchPerformance={branchPerformance}
          operatorPerformance={operatorPerformance}
        />
      )}
    </div>
  );
}