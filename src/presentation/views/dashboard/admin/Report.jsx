import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, Legend } from 'recharts';

import { getPlanRevenue, getPlanRevenueByBranch, getRevenues, getRevenueSummary } from '@/data/services/backendApi/dashboard';


const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString();
};

export function ReportPanel({ branchPerformance = [] }) {
  const branchOptions = useMemo(() => {
    return branchPerformance
      .filter((branch) => branch.branchId != null)
      .map((branch) => ({
        id: String(branch.branchId),
        name: branch.branchName,
      }));
  }, [branchPerformance]);

  const [selectedBranchId, setSelectedBranchId] = useState(() => branchOptions[0]?.id || '');
  const [planRevenue, setPlanRevenue] = useState([]);
  const [planRevenueLoading, setPlanRevenueLoading] = useState(false);
  const [planRevenueByBranch, setPlanRevenueByBranch] = useState([]);
  const [, setPlanRevenueByBranchLoading] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState({ perBranch: [], byType: [], total: 0 });
  const [, setRevenueSummaryLoading] = useState(false);

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

    // also load plan revenue grouped by branch so charts can show plan charges per branch
    const loadPlanRevenueByBranch = async () => {
      setPlanRevenueByBranchLoading(true);
      try {
        const data = await getPlanRevenueByBranch();
        if (isActive) {
          setPlanRevenueByBranch(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isActive) setPlanRevenueByBranch([]);
      } finally {
        if (isActive) setPlanRevenueByBranchLoading(false);
      }
    };

    loadPlanRevenueByBranch();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedBranch = useMemo(() => {
    return branchPerformance.find((branch) => String(branch.branchId) === String(selectedBranchId)) || null;
  }, [branchPerformance, selectedBranchId]);

  

  const selectedBranchLabel = selectedBranch?.branchName || 'Select branch';
  const selectedBranchTotalRevenue = useMemo(() => {
    if (!selectedBranch) return 0;
    const rb = (revenueSummary?.perBranch || []).find(
      (p) => String(p.branch_id || p.branchId) === String(selectedBranch.branchId)
    );
    return Number(rb?.revenue || selectedBranch.revenue || 0);
  }, [selectedBranch, revenueSummary]);

  const branchRevenueData = useMemo(() => {
    const perBranchMap = new Map((revenueSummary?.perBranch || []).map((r) => [String(r.branch_id || r.branchId || r.branch_id), r]));
    const planByBranchMap = new Map((planRevenueByBranch || []).map((r) => [String(r.branch_id || r.branchId || r.branch_id), r]));
    return [...branchPerformance]
      .map((branch) => {
        const branchIdKey = String(branch.branchId);
        const perBranch = perBranchMap.get(branchIdKey) || {};
        const totalRevenue = Number(perBranch.revenue || 0) || Number(branch.revenue || 0) || 0;
        // Prefer explicit plan revenue per-branch, then try values on branch object
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
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8);
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

  const [revenueRows, setRevenueRows] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  

  useEffect(() => {
    let active = true;
    const load = async () => {
      setRevenueLoading(true);
      try {
        const data = await getRevenues({ limit: 10 });
        if (!active) return;
        setRevenueRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        if (active) setRevenueRows([]);
      } finally {
        if (active) setRevenueLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      setRevenueSummaryLoading(true);
      try {
        const res = await getRevenueSummary();
        // controller returns { success, data: { perBranch, byType, total } }
        if (!active) return;
        if (res && res.data) {
          setRevenueSummary({ perBranch: res.data.perBranch || [], byType: res.data.byType || [], total: res.data.total || 0 });
        } else if (res && res.perBranch) {
          setRevenueSummary({ perBranch: res.perBranch || [], byType: res.byType || [], total: res.total || 0 });
        } else {
          setRevenueSummary({ perBranch: [], byType: [], total: 0 });
        }
      } catch (err) {
        console.error('Error fetching revenue summary:', err);
        if (active) setRevenueSummary({ perBranch: [], byType: [], total: 0 });
      } finally {
        if (active) setRevenueSummaryLoading(false);
      }
    };
    loadSummary();
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-white border border-[#f3f3f3] rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-[#f3f3f3] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">Report</h2>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#1f1f1f]">Summary report</h3>
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
                <p className="text-xs text-[#1f1f1f]">${Number(selectedBranchTotalRevenue || 0).toFixed(2)}</p>
                
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
                      <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
                      <Legend />
                      <Bar dataKey="simSales" name="SIM Sales" stackId="a" fill="#5b93ff" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="planRevenue" name="Plan Charges" stackId="a" fill="#3ebb7f" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="totalRevenue" name="Total" stroke="#ff8a00" strokeWidth={2} dot={{ r: 2 }} />
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
          <div className="rounded-xl border border-[#f3f3f3] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">Recent revenue records</p>
                <p className="text-xs text-[#828282]">Latest entries for quick inspection</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              {revenueLoading ? (
                <div className="h-24 flex items-center justify-center text-sm text-[#828282]">Loading revenue...</div>
              ) : revenueRows.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-sm text-[#828282]">No revenue records yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#828282]">
                      <th className="py-2">Date</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Branch</th>
                      <th className="py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRows.map((r) => (
                      <tr key={r.revenue_id} className="border-t border-[#f3f3f3]">
                        <td className="py-2">{new Date(r.revenue_date).toLocaleString()}</td>
                        <td className="py-2">${Number(r.amount || 0).toFixed(2)}</td>
                        <td className="py-2">{r.source || '-'}</td>
                        <td className="py-2">{(branchPerformance.find(b => String(b.branchId) === String(r.branch_id)) || {}).branchName || (r.branch_id ? `#${r.branch_id}` : '-')}</td>
                        <td className="py-2">{r.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
