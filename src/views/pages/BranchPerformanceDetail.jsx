import { useMemo, useState } from 'react';
import { Building2, Activity, DollarSign, Users } from 'lucide-react';
import { BackButton } from '../components/common/BackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

export function BranchPerformanceDetail({ branchName, operatorPerformance = [], users = [], onBack, transactions = [] }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const usersByName = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[String(user.name || '').toLowerCase()] = user;
      return acc;
    }, {});
  }, [users]);

  const branchPerformance = useMemo(() => {
    const matchingItems = operatorPerformance.filter((item) => (item.branch_name || 'No Branch') === branchName);
    if (matchingItems.length === 0) {
      return null;
    }

    return matchingItems.reduce((acc, item) => {
      const activityTime = item.last_activity_at ? new Date(item.last_activity_at).getTime() : 0;
      const currentTime = acc.lastActivityAt ? new Date(acc.lastActivityAt).getTime() : 0;

      return {
        branchName,
        operators: acc.operators + 1,
        simSold: acc.simSold + Number(item.sim_sales_count || 0),
        revenue: acc.revenue + Number(item.sim_sales_amount || 0),
        actions: acc.actions + Number(item.total_system_actions || 0),
        lastActivityAt: activityTime > currentTime ? item.last_activity_at : acc.lastActivityAt,
      };
    }, {
      branchName,
      operators: 0,
      simSold: 0,
      revenue: 0,
      actions: 0,
      lastActivityAt: null,
    });
  }, [branchName, operatorPerformance]);

  const branchEmployees = useMemo(() => {
    return operatorPerformance
      .filter((item) => (item.branch_name || 'No Branch') === branchName)
      .map((item) => {
        const matchedUser = usersByName[String(item.username || '').toLowerCase()];
        return {
          userId: item.user_id,
          username: item.username,
          role: matchedUser?.role || 'operator',
          email: matchedUser?.email || '-',
          simSold: Number(item.sim_sales_count || 0),
          revenue: Number(item.sim_sales_amount || 0),
          actions: Number(item.total_system_actions || 0),
          lastActivityAt: item.last_activity_at || null,
        };
      })
      .sort((first, second) => second.simSold - first.simSold);
  }, [branchName, operatorPerformance, usersByName]);

  // Get actions for selected employee
  const selectedEmployeeActions = useMemo(() => {
    if (!selectedEmployee) return [];
    return (transactions || [])
      .filter((tx) => String(tx.userId) === String(selectedEmployee.userId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedEmployee, transactions]);

  if (!branchPerformance) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} label="Back to branches"/>
        <div className="rounded-xl border border-[#f3f3f3] bg-white p-8 text-center text-sm text-[#828282] shadow-sm">
          Branch performance details were not found.
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Operators',
      value: branchPerformance.operators,
      icon: Users,
      tone: 'text-[#5b93ff] bg-[#5b93ff]/10',
    },
    {
      label: 'SIM Sold',
      value: branchPerformance.simSold,
      icon: Building2,
      tone: 'text-[#f6a94c] bg-[#f6a94c]/10',
    },
    {
      label: 'Revenue',
      value: `$${branchPerformance.revenue.toFixed(2)}`,
      icon: DollarSign,
      tone: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
    },
    {
      label: 'System Actions',
      value: branchPerformance.actions,
      icon: Activity,
      tone: 'text-[#1f1f1f] bg-[#1f1f1f]/10',
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} label="Back to branches"/>

      <div className="rounded-xl border border-[#f3f3f3] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#828282]">Branch Overview</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{branchPerformance.branchName}</h2>
            <p className="mt-1 text-sm text-[#828282]">Branch dashboard and team details</p>
          </div>
          <div className="text-sm text-[#828282]">
            Last Activity: {branchPerformance.lastActivityAt ? new Date(branchPerformance.lastActivityAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-[#f3f3f3] bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon className="h-5 w-5"/>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#1f1f1f]">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#f3f3f3] bg-white shadow-sm">
        <div className="border-b border-[#f3f3f3] px-5 py-4">
          <h3 className="text-base font-semibold text-[#1f1f1f]">Employees</h3>
          <p className="mt-1 text-sm text-[#828282]">Operator performance and recent activity in this branch</p>
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
                  className="border-b border-[#f9f9f9] last:border-0 cursor-pointer hover:bg-[#f5f8ff]"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setModalOpen(true);
                  }}
                >
                  <td className="px-5 py-3 text-[#1f1f1f]">
                    <div className="font-medium">{employee.username}</div>
                    <div className="text-xs text-[#828282]">{employee.email}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-[#1f1f1f]">{employee.role}</td>
                  <td className="px-5 py-3 text-[#1f1f1f]">{employee.simSold}</td>
                  <td className="px-5 py-3 text-[#1f1f1f]">${employee.revenue.toFixed(2)}</td>
                  <td className="px-5 py-3 text-[#1f1f1f]">{employee.actions}</td>
                  <td className="px-5 py-3 text-[#828282]">{employee.lastActivityAt ? new Date(employee.lastActivityAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
              {branchEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#828282]">No employee data available for this branch</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Employee Activity Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Activity for {selectedEmployee?.username}</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-xs text-[#828282]">{selectedEmployee?.email}</div>
            <div className="max-h-96 overflow-y-auto">
              {selectedEmployeeActions.length === 0 ? (
                <div className="text-center text-[#828282] py-8">No actions found for this employee.</div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">SIM</th>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">Customer</th>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">Plan</th>
                      <th className="px-4 py-3 text-left font-medium text-[#828282]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeeActions.map((action) => (
                      <tr key={action.id} className="border-b border-[#f3f3f3] last:border-0">
                        <td className="px-4 py-3 capitalize">{action.type}</td>
                        <td className="px-4 py-3">{action.date ? new Date(action.date).toLocaleString() : ''}</td>
                        <td className="px-4 py-3">{action.simIccid || action.simId || '-'}</td>
                        <td className="px-4 py-3">{action.customerName || action.customerId || '-'}</td>
                        <td className="px-4 py-3">{action.planName || action.planId || '-'}</td>
                        <td className="px-4 py-3 capitalize">{action.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <DialogClose asChild>
              <button className="mt-4 px-4 py-2 rounded bg-[#5b93ff] text-white hover:bg-[#4077c9]">Close</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}