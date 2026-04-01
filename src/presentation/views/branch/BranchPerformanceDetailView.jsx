import { useMemo, useState, useCallback, useEffect } from 'react';
import { Building2, Activity, DollarSign, Users } from 'lucide-react';
import { BackButton } from '@/presentation/views/components/common/BackButton';
import { Button } from '@/presentation/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/presentation/components/ui/dialog';

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-xl border border-[#f3f3f3] bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{value}</p>
    </div>
  );
}

export function BranchPerformanceDetailView({
  branchName,
  operatorPerformance = [],
  users = [],
  onBack,
  transactions = [],
}) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeActivityPage, setEmployeeActivityPage] = useState(1);

  // Temporary debug - you can remove this after confirming it works
  useEffect(() => {
    if (selectedEmployee) {
      console.log('Modal opened for:', selectedEmployee.username, '(user_id:', selectedEmployee.userId, ')');
      console.log('Total transactions received:', transactions.length);
    }
  }, [selectedEmployee, transactions]);

  // Normalize users
  const usersByUsername = useMemo(() => {
    return users.reduce((acc, user) => {
      const key = String(user?.username || user?.name || '').toLowerCase().trim();
      if (key) {
        acc[key] = user;
      }
      return acc;
    }, {});
  }, [users]);

  // Branch performance summary
  const branchPerformance = useMemo(() => {
    const matchingItems = operatorPerformance.filter(
      (item) => (item.branch_name || 'No Branch') === branchName
    );

    if (matchingItems.length === 0) return null;

    return matchingItems.reduce(
      (acc, item) => ({
        branchName,
        operators: acc.operators + 1,
        simSold: acc.simSold + Number(item.sim_sales_count || 0),
        revenue: acc.revenue + Number(item.sim_sales_amount || 0),
        actions: acc.actions + Number(item.total_system_actions || 0),
        lastActivityAt:
          new Date(item.last_activity_at || 0) > new Date(acc.lastActivityAt || 0)
            ? item.last_activity_at
            : acc.lastActivityAt,
      }),
      { branchName, operators: 0, simSold: 0, revenue: 0, actions: 0, lastActivityAt: null }
    );
  }, [branchName, operatorPerformance]);

  // Employee list
  const branchEmployees = useMemo(() => {
    return operatorPerformance
      .filter((item) => (item.branch_name || 'No Branch') === branchName)
      .map((item) => {
        const matchedUser = usersByUsername[String(item.username || '').toLowerCase().trim()];
        return {
          userId: item.user_id || item.userId,           // support both formats
          username: item.username || 'Unknown',
          role: matchedUser?.role || 'operator',
          email: matchedUser?.email || '-',
          simSold: Number(item.sim_sales_count || 0),
          revenue: Number(item.sim_sales_amount || 0),
          actions: Number(item.total_system_actions || 0),
          lastActivityAt: item.last_activity_at || null,
          sessionActive: Boolean(matchedUser?.sessionActive),
          lastLoginAt: matchedUser?.lastLoginAt || null,
          lastLogoutAt: matchedUser?.lastLogoutAt || null,
          sessionExpiresAt: matchedUser?.sessionExpiresAt || null,
          lastSessionIp: matchedUser?.lastSessionIp || null,
        };
      })
      .sort((a, b) => b.simSold - a.simSold || b.actions - a.actions);
  }, [branchName, operatorPerformance, usersByUsername]);

  // FIXED: Correctly match using user_id / userId from your actual data
  const selectedEmployeeActions = useMemo(() => {
    if (!selectedEmployee) return [];

    const targetId = String(selectedEmployee.userId || '').trim();
    const targetUsername = String(selectedEmployee.username || '').toLowerCase().trim();

    return (transactions || [])
      .filter((tx) => {
        const txUserId = String(tx.user_id || tx.userId || '').trim();
        const txUsername = String(tx.user_name || tx.userName || '').toLowerCase().trim();

        if (targetId && txUserId) {
          return txUserId === targetId;
        }

        if (targetUsername && txUsername) {
          return txUsername === targetUsername;
        }

        return false;
      })
      .sort((a, b) => 
        new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0)
      );
  }, [selectedEmployee, transactions]);

  const EMPLOYEE_ACTIVITY_PAGE_SIZE = 10;
  const employeeActivityTotalPages = Math.max(1, Math.ceil(selectedEmployeeActions.length / EMPLOYEE_ACTIVITY_PAGE_SIZE));
  const safeEmployeeActivityPage = Math.min(employeeActivityPage, employeeActivityTotalPages);
  const employeeActivityStartIndex = (safeEmployeeActivityPage - 1) * EMPLOYEE_ACTIVITY_PAGE_SIZE;
  const paginatedEmployeeActions = selectedEmployeeActions.slice(
    employeeActivityStartIndex,
    employeeActivityStartIndex + EMPLOYEE_ACTIVITY_PAGE_SIZE
  );

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const openEmployeeModal = useCallback((employee) => {
    setEmployeeActivityPage(1);
    setSelectedEmployee(employee);
  }, []);

  const closeModal = useCallback(() => {
    setEmployeeActivityPage(1);
    setSelectedEmployee(null);
  }, []);

  if (!branchPerformance) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} label="Back to branches" />
        <div className="rounded-xl border border-[#f3f3f3] bg-white p-8 text-center text-sm text-[#828282] shadow-sm">
          Branch performance details were not found.
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Operators', value: branchPerformance.operators, icon: Users, tone: 'text-[#5b93ff] bg-[#5b93ff]/10' },
    { label: 'SIM Sold', value: branchPerformance.simSold, icon: Building2, tone: 'text-[#f6a94c] bg-[#f6a94c]/10' },
    { label: 'Revenue', value: formatCurrency(branchPerformance.revenue), icon: DollarSign, tone: 'text-[#3ebb7f] bg-[#3ebb7f]/10' },
    { label: 'System Actions', value: branchPerformance.actions, icon: Activity, tone: 'text-[#1f1f1f] bg-[#1f1f1f]/10' },
  ];

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} label="Back to branches" />

      {/* Branch Header */}
      <div className="rounded-xl border border-[#f3f3f3] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#828282]">Branch Overview</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{branchPerformance.branchName}</h2>
            <p className="mt-1 text-sm text-[#828282]">Branch dashboard and team details</p>
          </div>
          <div className="text-sm text-[#828282]">
            Last Activity:{' '}
            {branchPerformance.lastActivityAt
              ? new Date(branchPerformance.lastActivityAt).toLocaleString()
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </div>

      {/* Employees Table */}
      <div className="rounded-xl border border-[#f3f3f3] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#f3f3f3] px-5 py-4">
          <h3 className="text-base font-semibold text-[#1f1f1f]">Employees</h3>
          <p className="mt-1 text-sm text-[#828282]">
            Operator performance and recent activity in this branch
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f3f3]">
                <th className="px-5 py-3 text-left font-medium text-[#828282]">Employee</th>
                <th className="px-5 py-3 text-left font-medium text-[#828282]">Role</th>
                <th className="px-5 py-3 text-left font-medium text-[#828282]">SIM Sold</th>
                <th className="px-5 py-3 text-left font-medium text-[#828282]">Revenue</th>
                <th className="px-5 py-3 text-left font-medium text-[#828282]">Actions</th>
                <th className="px-5 py-3 text-left font-medium text-[#828282]">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {branchEmployees.map((employee) => (
                <tr
                  key={employee.userId || employee.username}
                  role="button"
                  tabIndex={0}
                  className="border-b border-[#f9f9f9] last:border-0 cursor-pointer hover:bg-[#f5f8ff] transition-colors"
                  onClick={() => openEmployeeModal(employee)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEmployeeModal(employee);
                    }
                  }}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#1f1f1f]">{employee.username}</div>
                    <div className="text-xs text-[#828282]">{employee.email}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-[#1f1f1f]">{employee.role}</td>
                  <td className="px-5 py-3 text-[#1f1f1f] font-medium">{employee.simSold}</td>
                  <td className="px-5 py-3 text-[#1f1f1f]">{formatCurrency(employee.revenue)}</td>
                  <td className="px-5 py-3 text-[#1f1f1f] font-medium">{employee.actions}</td>
                  <td className="px-5 py-3 text-[#828282]">
                    {employee.lastActivityAt ? new Date(employee.lastActivityAt).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}

              {branchEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#828282]">
                    No employee data available for this branch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Activity Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Activity for {selectedEmployee?.username}</DialogTitle>
            <DialogDescription className="text-xs text-[#828282]">
              Recent sales and actions by {selectedEmployee?.username}
              {selectedEmployee?.email && ` (${selectedEmployee.email})`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                <p className="text-xs text-[#828282]">Session Status</p>
                <p className={`text-sm font-medium ${selectedEmployee?.sessionActive ? 'text-[#3ebb7f]' : 'text-[#828282]'}`}>
                  {selectedEmployee?.sessionActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                <p className="text-xs text-[#828282]">Last Login</p>
                <p className="text-sm font-medium text-[#1f1f1f]">
                  {selectedEmployee?.lastLoginAt
                    ? new Date(selectedEmployee.lastLoginAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                <p className="text-xs text-[#828282]">Last Logout</p>
                <p className="text-sm font-medium text-[#1f1f1f]">
                  {selectedEmployee?.lastLogoutAt
                    ? new Date(selectedEmployee.lastLogoutAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                <p className="text-xs text-[#828282]">Session Expires</p>
                <p className="text-sm font-medium text-[#1f1f1f]">
                  {selectedEmployee?.sessionExpiresAt
                    ? new Date(selectedEmployee.sessionExpiresAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {selectedEmployee?.lastSessionIp && (
              <div className="bg-white border border-[#f3f3f3] rounded-lg p-3 mb-4">
                <p className="text-xs text-[#828282]">Last Session IP</p>
                <p className="text-sm font-medium text-[#1f1f1f]">{selectedEmployee.lastSessionIp}</p>
              </div>
            )}

            <div className="max-h-[520px] overflow-y-auto">
              {selectedEmployeeActions.length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-[#828282]">No transactions found for this employee</p>
                </div>
              ) : (
                <>
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 bg-white z-10 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-[#828282]">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-[#828282]">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-[#828282]">Customer ID</th>
                        <th className="px-4 py-3 text-left font-medium text-[#828282]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployeeActions.map((tx, idx) => (
                        <tr key={tx.id || `${tx.date || tx.created_at || 'tx'}-${employeeActivityStartIndex + idx}`} className="border-b last:border-0 hover:bg-[#f8f9fa]">
                          <td className="px-4 py-3 capitalize">{tx.transaction_type || tx.type || '-'}</td>
                          <td className="px-4 py-3">
                            {tx.date || tx.created_at ? new Date(tx.date || tx.created_at).toLocaleString() : '-'}
                          </td>
                          <td className="px-4 py-3">{tx.customer_id || tx.customerId || '-'}</td>
                          <td className="px-4 py-3 capitalize font-medium text-green-600">
                            {tx.status || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedEmployeeActions.length > EMPLOYEE_ACTIVITY_PAGE_SIZE && (
                    <div className="mt-3 flex items-center justify-between text-xs text-[#828282] px-1">
                      <span>
                        Showing {employeeActivityStartIndex + 1}-{Math.min(employeeActivityStartIndex + paginatedEmployeeActions.length, selectedEmployeeActions.length)} of {selectedEmployeeActions.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEmployeeActivityPage((previous) => Math.max(1, previous - 1))}
                          disabled={safeEmployeeActivityPage === 1}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <span>{safeEmployeeActivityPage}/{employeeActivityTotalPages}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEmployeeActivityPage((previous) => Math.min(employeeActivityTotalPages, previous + 1))}
                          disabled={safeEmployeeActivityPage === employeeActivityTotalPages}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-auto">
            <DialogClose asChild>
              <button className="px-6 py-2.5 rounded-lg bg-[#5b93ff] text-white hover:bg-[#4077c9] font-medium">
                Close
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

