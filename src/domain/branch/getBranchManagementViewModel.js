import { getAllBranches } from '@/data/services/backendApi/branch';
import { apiRequest } from '@/data/services/backendApi/client';
import { ENDPOINTS } from '@/data/services/endpoints';
import { getOperatorPerformance } from '@/data/services/backendApi/dashboard';

// Helper to fetch all users
async function getAllUsers() {
  return apiRequest(ENDPOINTS.users.list);
}

// Main domain function
export async function getBranchManagementViewModel() {
  // Fetch all data in parallel
  const [branches, users, performance] = await Promise.all([
    getAllBranches(),
    getAllUsers(),
    getOperatorPerformance(),
  ]);

  // Map performance by branchId
  const perfByBranch = {};
  if (Array.isArray(performance)) {
    performance.forEach(p => {
      perfByBranch[p.branch_id] = p;
    });
  }

  // Map users by branch and role
  const usersByBranch = {};
  if (Array.isArray(users)) {
    users.forEach(u => {
      const branchId = u.branchId || u.branch_id;
      if (!usersByBranch[branchId]) usersByBranch[branchId] = { operators: [], managers: [] };
      if (u.role === 'operator') usersByBranch[branchId].operators.push(u);
      else if (u.role === 'manager') usersByBranch[branchId].managers.push(u);
    });
  }

  // Combine all into view model
  return branches.map(branch => {
    const branchId = branch.id || branch.branch_id;
    return {
      ...branch,
      operators: usersByBranch[branchId]?.operators || [],
      managers: usersByBranch[branchId]?.managers || [],
      performance: perfByBranch[branchId] || { revenue: 0, simSold: 0 },
    };
  });
}
