import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, PieChart, Pie, Cell } from 'recharts';
import { getPlanRevenue, getRevenueSummary } from '@/data/services/backendApi/dashboard';
import { Loading } from '@/presentation/components/ui/Loading';

// --- Reusable Skeleton Loader ---
const ChartSkeleton = () => (
  <div className="h-64 w-full flex items-center justify-center">
    <Loading message="Loading chart..." />
  </div>
);

const TableSkeleton = () => (
  <div className="p-4">
    <Loading message="Loading..." />
  </div>
);

export function ReportPanel({ branchPerformance = [] }) {
    // Branch options for dropdown (if needed in future)
    const branchOptions = useMemo(() => {
      return branchPerformance
        .filter((branch) => branch.branchId != null)
        .map((branch) => ({
          id: String(branch.branchId),
          name: branch.branchName,
        }));
    }, [branchPerformance]);

    // State hooks
    const [planRevenue, setPlanRevenue] = useState([]);
    const [planRevenueLoading, setPlanRevenueLoading] = useState(false);
    const [planRevenueByBranch] = useState([]); // Not used but kept for completeness
    const [revenueSummary, setRevenueSummary] = useState({ perBranch: [], byType: [], total: 0 });
    const [revenueRows] = useState([]); // Not used in this snippet but likely needed for table
    const [revenueLoading] = useState(false); // Not used in this snippet but likely needed for table
    // Remove unused getPlanRevenueByBranch, getRevenues imports
  useEffect(() => {
    let isActive = true;
    const loadPlanRevenue = async () => {
      setPlanRevenueLoading(true);
      try {
        const data = await getPlanRevenue();
        if (isActive) setPlanRevenue(Array.isArray(data) ? data : []);
      } catch {
        if (isActive) setPlanRevenue([]);
      } finally {
        if (isActive) setPlanRevenueLoading(false);
      }
    };
    loadPlanRevenue();
    return () => { isActive = false; };
  }, [branchOptions]);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        const res = await getRevenueSummary();
        if (!active) return;
        if (res?.data) {
          setRevenueSummary({ perBranch: res.data.perBranch || [], byType: res.data.byType || [], total: res.data.total || 0 });
        } else if (res?.perBranch) {
          setRevenueSummary({ perBranch: res.perBranch || [], byType: res.byType || [], total: res.total || 0 });
        } else {
          setRevenueSummary({ perBranch: [], byType: [], total: 0 });
        }
      } catch (err) {
        console.error('Error fetching revenue summary:', err);
        if (active) setRevenueSummary({ perBranch: [], byType: [], total: 0 });
      } finally {
        // No loading state for summary in this snippet, but could be added if needed
      }
    };
    loadSummary();
    return () => { active = false; };
  }, []);

  const branchRevenueData = useMemo(() => {
    const perBranchMap = new Map((revenueSummary?.perBranch || []).map((r) => [String(r.branch_id || r.branchId || r.branch_id), r]));
    const planByBranchMap = new Map((planRevenueByBranch || []).map((r) => [String(r.branch_id || r.branchId || r.branch_id), r]));
    return [...branchPerformance]
      .map((branch) => {
        const branchIdKey = String(branch.branchId);
        const perBranch = perBranchMap.get(branchIdKey) || {};
        const totalRevenue = Number(perBranch.revenue || 0) || Number(branch.revenue || 0) || 0;
        const planRevenueAmt = Number(planByBranchMap.get(branchIdKey)?.total_revenue ?? branch.performance?.planRevenue ?? branch.planRevenue ?? branch.plan_revenue ?? 0) || 0;
        const simSalesRevenue = Math.max(totalRevenue - planRevenueAmt, 0);
        return {
          name: branch.branchName,
          simSales: simSalesRevenue,
          planRevenue: planRevenueAmt,
          totalRevenue,
          simSold: Number(branch.simSold || 0),
        };
      })
      .sort((a, b) => b.simSales - a.simSales);
  }, [branchPerformance, planRevenueByBranch, revenueSummary?.perBranch]);

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

  const formatCurrency = (value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const branchChartTotal = useMemo(() => {
    return (branchRevenueData || []).reduce((sum, b) => sum + (Number(b.simSales) || 0), 0);
  }, [branchRevenueData]);

  const planChartTotal = useMemo(() => {
    return (planRevenueData || []).reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);
  }, [planRevenueData]);

  const simStatusData = useMemo(() => {
    return [
      { name: 'Active SIMs', value: 1 },
      { name: 'Deactivated', value: 3 },
      { name: 'Suspended', value: 0 },
      { name: 'In Stock', value: 16 },
    ];
  }, []);

  const simTotal = useMemo(() => {
    return (simStatusData || []).reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  }, [simStatusData]);

  const overallTotal = (Number(branchChartTotal) || 0) + (Number(planChartTotal) || 0);

  const formatShortCurrency = (val) => {
    const n = Number(val) || 0;
    if (n === 0) return '$0';
    if (Math.abs(n) < 1000) return `$${n.toLocaleString('en-US')}`;
    if (Math.abs(n) < 1000000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${(n / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Revenue Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Performance overview and recent transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">Total revenue</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(overallTotal)}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Card (col 1) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 h-72">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Total SIMs</h3>
                <p className="text-xs text-gray-500 mt-0.5">By status</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{simTotal}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">units</div>
              </div>
            </div>
            <div className="flex items-center gap-4 h-full">
              <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} units (${(props?.percent * 100).toFixed(0)}%)`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Pie
                      data={simStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="#ffffff"
                      strokeWidth={2}
                      isAnimationActive={true}
                      animationDuration={600}
                    >
                      {simStatusData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={['#10b981', '#ef4444', '#f59e0b', '#3b82f6'][idx % 4]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">{simTotal}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
                </div>
              </div>
              <div className="w-40 flex flex-col gap-1.5">
                {simStatusData.map((s, idx) => {
                  const percent = simTotal > 0 ? Math.round((s.value / simTotal) * 100) : 0;
                  return (
                    <div key={s.name} className="flex items-center justify-between py-1 px-2 rounded-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'][idx % 4] }} />
                        <span className="text-sm text-gray-600">{s.name}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 tabular-nums">
                        {s.value} <span className="text-xs font-normal text-gray-400">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 pl-3">
              </div>
            </div>
          </div>
          {/* Branch Revenue Chart (col 2) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 h-72">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">SIM Sales Revenue by Branch</h3>
                <p className="text-xs text-gray-500 mt-0.5">Branches by SIM sales revenue</p>
              </div>
              <div className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(branchChartTotal)}</span></div>
            </div>
            <div className="h-full">
              {planRevenueLoading ? (
                <ChartSkeleton />
              ) : branchRevenueData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">No branch revenue data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchRevenueData} margin={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatShortCurrency}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="simSales" name="SIM Sales" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Plan Revenue Chart (col 3) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 h-72">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Service Plan Revenue</h3>
                <p className="text-xs text-gray-500 mt-0.5">Top plans by revenue contribution</p>
              </div>
              <div className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900">{formatCurrency(planChartTotal)}</span></div>
            </div>
            <div className="h-full">
              {planRevenueLoading ? (
                <ChartSkeleton />
              ) : planRevenueData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-sm">No plan revenue data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planRevenueData} margin={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatShortCurrency}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Revenue Table */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Revenue Records</h3>
              <p className="text-xs text-gray-500 mt-0.5">Latest 10 entries</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {revenueLoading ? (
              <div className="p-5"><TableSkeleton /></div>
            ) : revenueRows.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm">No revenue records yet</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Branch</th>
                    <th className="px-5 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenueRows.map((r) => (
                    <tr key={r.revenue_id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                        {new Date(r.revenue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {r.source || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {(branchPerformance.find(b => String(b.branchId) === String(r.branch_id)) || {}).branchName || (r.branch_id ? `Branch #${r.branch_id}` : '-')}
                      </td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate" title={r.description}>
                        {r.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}