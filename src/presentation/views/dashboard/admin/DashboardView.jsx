import { cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { StatsCard } from '@/presentation/views/components/common/StatsCard';

const OPERATOR_COLUMN_ORDER = ['operator', 'branch', 'simSold', 'revenue', 'actions', 'lastActivity'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-dashboard-operator-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === OPERATOR_COLUMN_ORDER.length
  && OPERATOR_COLUMN_ORDER.every((columnId) => value.includes(columnId));

export function DashboardView({ stats, userRole, operatorPerformance = [], onOpenBranchDetail }) {
  const canViewOperatorPerformance = userRole === 'admin';
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (!raw) {
        return OPERATOR_COLUMN_ORDER;
      }
      const parsed = JSON.parse(raw);
      return isValidColumnOrder(parsed) ? parsed : OPERATOR_COLUMN_ORDER;
    }
    catch {
      return OPERATOR_COLUMN_ORDER;
    }
  });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dropTargetColumn, setDropTargetColumn] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
    }
    catch {
      // ignore storage errors
    }
  }, [columnOrder]);
  const handleColumnDragStart = (columnId) => {
    return (event) => {
      setDraggedColumn(columnId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnId);
    };
  };
  const handleColumnDragOver = (columnId) => {
    return (event) => {
      event.preventDefault();
      if (dropTargetColumn !== columnId) {
        setDropTargetColumn(columnId);
      }
    };
  };
  const handleColumnDrop = (targetColumnId) => {
    return (event) => {
      event.preventDefault();
      const sourceColumnId = draggedColumn || event.dataTransfer.getData('text/plain');
      if (!sourceColumnId || sourceColumnId === targetColumnId) {
        setDropTargetColumn(null);
        return;
      }
      setColumnOrder((currentOrder) => {
        const fromIndex = currentOrder.indexOf(sourceColumnId);
        const toIndex = currentOrder.indexOf(targetColumnId);
        if (fromIndex === -1 || toIndex === -1) {
          return currentOrder;
        }
        const updatedOrder = [...currentOrder];
        const [movedColumn] = updatedOrder.splice(fromIndex, 1);
        updatedOrder.splice(toIndex, 0, movedColumn);
        return updatedOrder;
      });
      setDraggedColumn(null);
      setDropTargetColumn(null);
    };
  };
  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDropTargetColumn(null);
  };
  // Pagination state for Operator Performance
  const [operatorPage, setOperatorPage] = useState(1);
  const operatorRowsPerPage = 10;
  const operatorTotalPages = Math.ceil(operatorPerformance.length / operatorRowsPerPage);
  const paginatedOperatorPerformance = useMemo(() => {
    const start = (operatorPage - 1) * operatorRowsPerPage;
    return operatorPerformance.slice(start, start + operatorRowsPerPage);
  }, [operatorPerformance, operatorPage]);

  const operatorColumns = {
    operator: {
      label: 'Operator',
      renderCell: (item) => <td className="px-5 py-3 text-[#1f1f1f] font-medium transition-all duration-200">{item.username}</td>
    },
    branch: {
      label: 'Branch',
      renderCell: (item) => <td className="px-5 py-3 text-[#828282] transition-all duration-200">{item.branch_name || 'N/A'}</td>
    },
    simSold: {
      label: 'SIM Sold',
      renderCell: (item) => <td className="px-5 py-3 text-[#1f1f1f] transition-all duration-200">{Number(item.sim_sales_count || 0)}</td>
    },
    revenue: {
      label: 'Revenue',
      renderCell: (item) => <td className="px-5 py-3 text-[#1f1f1f] transition-all duration-200">${Number(item.sim_sales_amount || 0).toFixed(2)}</td>
    },
    actions: {
      label: 'System Actions',
      renderCell: (item) => <td className="px-5 py-3 text-[#1f1f1f] transition-all duration-200">{Number(item.total_system_actions || 0)}</td>
    },
    lastActivity: {
      label: 'Last Activity',
      renderCell: (item) => <td className="px-5 py-3 text-[#828282] transition-all duration-200">{item.last_activity_at ? new Date(item.last_activity_at).toLocaleString() : 'N/A'}</td>
    }
  };

  const branchPerformance = useMemo(() => {
    const grouped = operatorPerformance.reduce((acc, item) => {
      const branchName = item.branch_name || 'No Branch';
      if (!acc[branchName]) {
        acc[branchName] = {
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

      {canViewOperatorPerformance && (<div className="bg-white border border-[#f3f3f3] rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-[#f3f3f3]">
            <h2 className="text-lg font-semibold text-[#1f1f1f]">Operator Performance</h2>
            <p className="text-sm text-[#828282] mt-1">Sales output and activity logs by operator</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#f3f3f3]">
                  {columnOrder.map((columnId) => (<th key={columnId} draggable onDragStart={handleColumnDragStart(columnId)} onDragOver={handleColumnDragOver(columnId)} onDrop={handleColumnDrop(columnId)} onDragEnd={handleColumnDragEnd} className={`text-left px-5 py-3 text-sm font-medium text-[#828282] cursor-move whitespace-nowrap transition-all duration-200 ${draggedColumn === columnId ? 'opacity-60 scale-[0.98]' : ''} ${dropTargetColumn === columnId ? 'bg-[#f9f9f9]' : ''}`}>
                      {operatorColumns[columnId].label}
                    </th>))}
                </tr>
              </thead>
              <tbody>
                {operatorPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={columnOrder.length} className="px-5 py-8 text-center text-[#828282]">No operator performance data available</td>
                  </tr>
                ) : (
                  paginatedOperatorPerformance.map((item) => (
                    <tr key={item.user_id} className="border-b border-[#f9f9f9] last:border-0">
                      {columnOrder.map((columnId) => {
                        const cell = operatorColumns[columnId].renderCell(item);
                        if (!isValidElement(cell)) {
                          return null;
                        }
                        return cloneElement(cell, { key: `${item.user_id}-${columnId}` });
                      })}
                    </tr>
                  ))
                )}
                          {/* Pagination Controls */}
                          {operatorTotalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 px-5 py-3">
                              <button
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                                onClick={() => setOperatorPage((p) => Math.max(1, p - 1))}
                                disabled={operatorPage === 1}
                              >
                                Prev
                              </button>
                              <span className="text-xs text-[#828282]">
                                Page {operatorPage} of {operatorTotalPages}
                              </span>
                              <button
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                                onClick={() => setOperatorPage((p) => Math.min(operatorTotalPages, p + 1))}
                                disabled={operatorPage === operatorTotalPages}
                              >
                                Next
                              </button>
                            </div>
                          )}
              </tbody>
            </table>
          </div>
        </div>)}
    </div>);
}

