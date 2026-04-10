import { getAllBranches } from '@/data/services/backendApi/branch';
import { apiRequest } from '@/data/services/backendApi/client';
import { ENDPOINTS } from '@/data/services/endpoints';
import { getOperatorPerformance, getPlanRevenueByBranch } from '@/data/services/backendApi/dashboard';

// Helper to fetch all users
async function getAllUsers() {
  return apiRequest(ENDPOINTS.users.list);
}

// Main domain function
export async function getBranchManagementViewModel() {
  // Fetch all data in parallel
  const [branches, users, performance, planRevenue] = await Promise.all([
    getAllBranches(),
    getAllUsers(),
    getOperatorPerformance(),
    getPlanRevenueByBranch(),
  ]);

  // Aggregate operator performance totals by branchId
  const perfByBranch = {};
  if (Array.isArray(performance)) {
    performance.forEach(p => {
      const branchKey = p.branch_id ?? p.branchId ?? null;
      if (branchKey == null) return;

      const amount = Number(p.sim_sales_amount ?? p.simSalesAmount ?? p.sim_sales ?? p.simSales ?? 0) || 0;
      const count = Number(p.sim_sales_count ?? p.simSalesCount ?? p.sim_sales_count ?? p.simSalesCount ?? 0) || 0;

      if (!perfByBranch[branchKey]) {
        perfByBranch[branchKey] = {
          sim_sales_amount: amount,
          sim_sales_count: count,
          _raw: [p],
        };
      } else {
        perfByBranch[branchKey].sim_sales_amount = (Number(perfByBranch[branchKey].sim_sales_amount) || 0) + amount;
        perfByBranch[branchKey].sim_sales_count = (Number(perfByBranch[branchKey].sim_sales_count) || 0) + count;
        perfByBranch[branchKey]._raw.push(p);
      }
    });
  }

  // Map plan revenue totals by branchId (if provided by the API)
  const planRevByBranch = {};
  if (Array.isArray(planRevenue)) {
    planRevenue.forEach(row => {
      const branchKey = row.branch_id ?? row.branchId ?? null;
      const amount = Number(row.total_revenue ?? row.totalRevenue ?? row.revenue ?? 0) || 0;
      if (branchKey == null) return;
      planRevByBranch[branchKey] = (planRevByBranch[branchKey] || 0) + amount;
    });
  }

  // Map users by branch and role
  const usersByBranch = {};
  if (Array.isArray(users)) {
    users.forEach(u => {
      const branchId = u.branchId || u.branch_id || u.branchId;
      if (!usersByBranch[branchId]) usersByBranch[branchId] = { operators: [], managers: [] };

      // Normalize user shape for the UI
      const normalized = {
        id: u.id ?? u.user_id ?? u.userId,
        name: u.username ?? u.name ?? ((`${u.first_name || ''} ${u.last_name || ''}`).trim() || null),
        role: u.role,
        email: u.email || u.email_address || null,
        branchId: branchId,
        joined: u.created_at ?? u.createdAt ?? null,
        sessionStatus: u.session_active || u.session_active === 1 || false,
        lastLogin: u.last_login_at ?? u.lastLoginAt ?? null,
        lastLogout: u.last_logout_at ?? u.lastLogoutAt ?? null,
        lastSessionIp: u.last_session_ip ?? u.lastSessionIp ?? null,
        // keep raw for other use
        _raw: u,
      };

      if (u.role === 'operator') usersByBranch[branchId].operators.push(normalized);
      else if (u.role === 'manager') usersByBranch[branchId].managers.push(normalized);
    });
  }

  // Combine all into view model
  return branches.map(branch => {
    const branchId = branch.id || branch.branch_id;
    return {
      ...branch,
      operators: usersByBranch[branchId]?.operators || [],
      managers: usersByBranch[branchId]?.managers || [],
      performance: (() => {
        const p = perfByBranch[branchId] || {};
        const simSalesAmount = Number(p.sim_sales_amount ?? p.simSalesAmount ?? p.sim_sales ?? p.simSales ?? 0) || 0;
        const simSalesCount = Number(p.sim_sales_count ?? p.simSalesCount ?? p.sim_sales ?? p.simSales ?? 0) || 0;
        const planRevenueForBranch = Number(planRevByBranch[branchId] || 0);
        return {
          revenue: simSalesAmount + planRevenueForBranch,
          simSold: simSalesCount,
          simSalesAmount: simSalesAmount,
          planRevenue: planRevenueForBranch,
          _raw: p,
        };
      })(),
    };
  });
}
