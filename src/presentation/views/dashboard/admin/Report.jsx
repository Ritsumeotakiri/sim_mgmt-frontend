import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchAlertThresholds } from '@/data/services/backendApi/setting';
import { getPlanRevenue } from '@/data/services/backendApi/dashboard';

const DEFAULT_THRESHOLDS = {
  inactivityDays: 30,
  zeroSalesDays: 7,
};

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
};

const daysSince = (value) => {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
};

export function ReportPanel({ branchPerformance = [], operatorPerformance = [] }) {
  const branchOptions = useMemo(() => {
    return branchPerformance
      .filter((branch) => branch.branchId != null)
      .map((branch) => ({
        id: String(branch.branchId),
        name: branch.branchName,
      }));
  }, [branchPerformance]);

  const [selectedBranchId, setSelectedBranchId] = useState(() => branchOptions[0]?.id || '');
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [planRevenue, setPlanRevenue] = useState([]);
  const [planRevenueLoading, setPlanRevenueLoading] = useState(false);

  useEffect(() => {
    if (!branchOptions.length) {
      setSelectedBranchId('');
      return;
    }

    if (!selectedBranchId || !branchOptions.some((option) => option.id === selectedBranchId)) {
      setSelectedBranchId(branchOptions[0].id);
    }
  }, [branchOptions, selectedBranchId]);

  useEffect(() => {
    const loadThresholds = async () => {
      if (!selectedBranchId) {
        return;
      }

      try {
        const data = await fetchAlertThresholds(selectedBranchId);
        const nextThresholds = {
          inactivityDays: Number(data?.inactivityDays) || DEFAULT_THRESHOLDS.inactivityDays,
          zeroSalesDays: Number(data?.zeroSalesDays) || DEFAULT_THRESHOLDS.zeroSalesDays,
        };
        setThresholds(nextThresholds);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        // ignore threshold load failures
      }
    };

    loadThresholds();
  }, [selectedBranchId]);

  useEffect(() => {
    let isActive = true;

    const loadPlanRevenue = async () => {
      setPlanRevenueLoading(true);
      try {
        const data = await getPlanRevenue();
        if (isActive) {
          setPlanRevenue(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isActive) {
          setPlanRevenue([]);
        }
      } finally {
        if (isActive) {
          setPlanRevenueLoading(false);
        }
      }
    };

    loadPlanRevenue();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedBranch = useMemo(() => {
    return branchPerformance.find((branch) => String(branch.branchId) === String(selectedBranchId)) || null;
  }, [branchPerformance, selectedBranchId]);

  const scopedOperators = useMemo(() => {
    if (!selectedBranchId) {
      return [];
    }

    return operatorPerformance.filter((item) => String(item.branch_id) === String(selectedBranchId));
  }, [operatorPerformance, selectedBranchId]);

  const alerts = useMemo(() => {
    if (!selectedBranchId || !selectedBranch) {
      return [];
    }

    const results = [];
    const inactivityDays = Number(thresholds.inactivityDays) || DEFAULT_THRESHOLDS.inactivityDays;
    const zeroSalesDays = Number(thresholds.zeroSalesDays) || DEFAULT_THRESHOLDS.zeroSalesDays;
    const branchLastActivity = selectedBranch.lastActivityAt;
    const branchDaysSince = daysSince(branchLastActivity) ?? Infinity;

    if (!branchLastActivity) {
      results.push({
        id: `branch-${selectedBranchId}-inactive`,
        severity: 'critical',
        title: 'Branch has no recent activity',
        entity: selectedBranch.branchName,
        detail: 'No activity has been recorded yet for this branch.',
        lastActivity: 'N/A',
      });
    } else if (branchDaysSince >= inactivityDays) {
      results.push({
        id: `branch-${selectedBranchId}-inactive`,
        severity: branchDaysSince >= inactivityDays * 2 ? 'critical' : 'warning',
        title: 'Branch inactivity threshold exceeded',
        entity: selectedBranch.branchName,
        detail: `${branchDaysSince} days since last activity.`,
        lastActivity: formatDateTime(branchLastActivity),
      });
    }

    if (selectedBranch.simSold === 0 && branchDaysSince >= zeroSalesDays) {
      results.push({
        id: `branch-${selectedBranchId}-zero-sales`,
        severity: branchDaysSince >= zeroSalesDays * 2 ? 'warning' : 'info',
        title: 'No sales recorded for branch',
        entity: selectedBranch.branchName,
        detail: `${branchDaysSince} days since last recorded activity.`,
        lastActivity: formatDateTime(branchLastActivity),
      });
    }

    scopedOperators.forEach((operator) => {
      const operatorName = operator.username || 'Unknown operator';
      const lastActivity = operator.last_activity_at;
      const operatorDaysSince = daysSince(lastActivity) ?? Infinity;

      if (!lastActivity) {
        results.push({
          id: `operator-${operator.user_id}-inactive`,
          severity: 'critical',
          title: 'Operator has no recorded activity',
          entity: operatorName,
          detail: 'No activity has been recorded yet for this operator.',
          lastActivity: 'N/A',
        });
      } else if (operatorDaysSince >= inactivityDays) {
        results.push({
          id: `operator-${operator.user_id}-inactive`,
          severity: operatorDaysSince >= inactivityDays * 2 ? 'critical' : 'warning',
          title: 'Operator inactivity threshold exceeded',
          entity: operatorName,
          detail: `${operatorDaysSince} days since last activity.`,
          lastActivity: formatDateTime(lastActivity),
        });
      }

      if (Number(operator.sim_sales_count || 0) === 0 && operatorDaysSince >= zeroSalesDays) {
        results.push({
          id: `operator-${operator.user_id}-zero-sales`,
          severity: operatorDaysSince >= zeroSalesDays * 2 ? 'warning' : 'info',
          title: 'No sales recorded for operator',
          entity: operatorName,
          detail: `${operatorDaysSince} days since last recorded activity.`,
          lastActivity: formatDateTime(lastActivity),
        });
      }
    });

    return results;
  }, [selectedBranchId, selectedBranch, scopedOperators, thresholds]);

  const selectedBranchLabel = selectedBranch?.branchName || 'Select branch';

  const branchRevenueData = useMemo(() => {
    return [...branchPerformance]
      .map((branch) => ({
        name: branch.branchName,
        revenue: Number(branch.revenue || 0),
        simSold: Number(branch.simSold || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [branchPerformance]);

  const planRevenueData = useMemo(() => {
    return planRevenue
      .map((row) => ({
        name: row.plan_name || 'No plan',
        revenue: Number(row.total_revenue || 0),
        transactions: Number(row.transaction_count || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [planRevenue]);

  return (
    <div className="bg-white border border-[#f3f3f3] rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-[#f3f3f3] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Report</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[#828282]">Scope</span>
          <select
            className="rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-sm text-[#1f1f1f]"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            disabled={!branchOptions.length}
          >
            {branchOptions.length === 0 && <option value="">No branches</option>}
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1f1f1f]">Summary report</h3>
            <span className="text-xs text-[#828282]">{alerts.length} signals</span>
          </div>

          <div className="rounded-xl border border-[#f3f3f3] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#f3f3f3] p-3">
                <p className="text-xs text-[#828282]">Branch</p>
                <p className="text-sm font-semibold text-[#1f1f1f]">{selectedBranchLabel}</p>
                <p className="text-xs text-[#828282] mt-2">Last activity</p>
                <p className="text-xs text-[#1f1f1f]">{formatDateTime(selectedBranch?.lastActivityAt)}</p>
              </div>
              <div className="rounded-lg border border-[#f3f3f3] p-3">
                <p className="text-xs text-[#828282]">Operators</p>
                <p className="text-sm font-semibold text-[#1f1f1f]">{selectedBranch?.operators ?? 0}</p>
                <p className="text-xs text-[#828282] mt-2">Total actions</p>
                <p className="text-xs text-[#1f1f1f]">{selectedBranch?.actions ?? 0}</p>
              </div>
              <div className="rounded-lg border border-[#f3f3f3] p-3">
                <p className="text-xs text-[#828282]">Sales</p>
                <p className="text-sm font-semibold text-[#1f1f1f]">{selectedBranch?.simSold ?? 0}</p>
                <p className="text-xs text-[#828282] mt-2">Revenue</p>
                <p className="text-xs text-[#1f1f1f]">${Number(selectedBranch?.revenue ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#f3f3f3] p-4">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">SIM sales revenue by branch</p>
                <p className="text-xs text-[#828282]">Top branches by revenue</p>
              </div>
              <div className="h-64 mt-3">
                {branchRevenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#828282]">
                    No branch revenue data yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchRevenueData} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#828282', fontSize: 11 }}
                        axisLine={{ stroke: '#f3f3f3' }}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        height={50}
                      />
                      <YAxis
                        tick={{ fill: '#828282', fontSize: 11 }}
                        axisLine={{ stroke: '#f3f3f3' }}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="revenue" name="Revenue" fill="#5b93ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#f3f3f3] p-4">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">Service plan sales revenue</p>
                <p className="text-xs text-[#828282]">Top plans by revenue</p>
              </div>
              <div className="h-64 mt-3">
                {planRevenueLoading ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#828282]">
                    Loading plan revenue...
                  </div>
                ) : planRevenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-[#828282]">
                    No plan revenue data yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planRevenueData} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#828282', fontSize: 11 }}
                        axisLine={{ stroke: '#f3f3f3' }}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        height={50}
                      />
                      <YAxis
                        tick={{ fill: '#828282', fontSize: 11 }}
                        axisLine={{ stroke: '#f3f3f3' }}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="revenue" name="Revenue" fill="#3ebb7f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
