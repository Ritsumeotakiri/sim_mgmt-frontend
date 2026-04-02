import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Edit2, Trash2, ShoppingCart } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { Button } from '@/presentation/components/ui/button';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequest, apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapSim } from '@/data/services/backendApi/mappers';
import { backendApi } from '@/data/services/backendApi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/presentation/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'sonner';
import { addBalanceToSim, assignPlanToSim } from '@/data/services/backendApi/sim';

// Inlined constants and getColumns function (restored from original)
// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_COLUMN_ORDER = [
  'sim',
  'status',
  'msisdn',
  'assignedTo',
  'planId',
  'branchName',
  'createdAt',
  'actions',
];
export const COLUMN_ORDER_STORAGE_KEY = 'simTableColumnOrder';
// eslint-disable-next-line react-refresh/only-export-components
export function isValidColumnOrder(order) {
  return (
    Array.isArray(order) &&
    order.length === DEFAULT_COLUMN_ORDER.length &&
    order.every((col) => DEFAULT_COLUMN_ORDER.includes(col))
  );
}

// Minimal getColumns implementation (should be replaced with your actual column definitions)
// eslint-disable-next-line react-refresh/only-export-components
export function getColumns({ canSell, canEdit, canDelete, onSell, onEdit, handleDelete }) {
  return {
    sim: {
      label: 'SIM',
      renderCell: (sim, getSimLabel) => (
        <td className="px-3 py-3 font-mono text-[#1f1f1f]">
          {getSimLabel ? getSimLabel(sim) : sim.iccid}
        </td>
      ),
    },
    status: {
      label: 'Status',
      renderCell: (sim) => (
        <td className="px-3 py-3">
          <StatusBadge status={sim.status} />
        </td>
      ),
    },
    msisdn: {
      label: 'MSISDN',
      renderCell: (sim) => (
        <td className="px-3 py-3">{sim.msisdn || '—'}</td>
      ),
    },
    assignedTo: {
      label: 'Customer',
      renderCell: (sim) => (
        <td className="px-3 py-3">{sim.assignedTo || '—'}</td>
      ),
    },
    planId: {
      label: 'Plan',
      renderCell: (sim) => (
        <td className="px-3 py-3">{sim.planId ? 'Assigned' : '—'}</td>
      ),
    },
    branchName: {
      label: 'Branch',
      renderCell: (sim) => (
        <td className="px-3 py-3">{sim.branchName || 'No branch'}</td>
      ),
    },
    createdAt: {
      label: 'Created',
      renderCell: (sim) => (
        <td className="px-3 py-3">{sim.createdAt ? new Date(sim.createdAt).toLocaleDateString() : '—'}</td>
      ),
    },
    actions: {
      label: 'Actions',
      renderCell: (sim) => (
        <td className="px-3 py-3 transition-all duration-200">
          <div className="flex items-center gap-1 justify-end">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#f3f3f3]"
                onClick={e => { e.stopPropagation(); onEdit(sim); }}
              >
                <Edit2 className="w-4 h-4 text-[#828282]" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#f3f3f3]"
                onClick={e => { e.stopPropagation(); handleDelete(sim.id); }}
              >
                <Trash2 className="w-4 h-4 text-[#e9423a]" />
              </Button>
            )}
            {canSell && sim.status === 'inactive' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[#f3f3f3]"
                onClick={e => { e.stopPropagation(); onSell(sim); }}
                title="Sell"
              >
                <ShoppingCart className="w-4 h-4 text-[#1f1f1f]" />
              </Button>
            )}
          </div>
        </td>
      ),
    },
  };
  };



export function SIMTable({ sims, userRole, userId = null, branchId = null, plans = [], onEdit, onDelete, onAdd, onSell, onBulkDelete, onBulkUpdateBranch, useServerPagination = false, selectedSimId = null, onOpenSimDetail, onCloseSimDetail }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSIM, setSelectedSIM] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [simToDelete, setSimToDelete] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkBranchId, setBulkBranchId] = useState('');
    const [serverSims, setServerSims] = useState([]);
    const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    const [loading, setLoading] = useState(false);
    const [historyEvents, setHistoryEvents] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [customerHistoryOpen, setCustomerHistoryOpen] = useState(false);
    const [lifecycleHistoryOpen, setLifecycleHistoryOpen] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [reloadKey, setReloadKey] = useState(0);
    const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [isAddingBalance, setIsAddingBalance] = useState(false);
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [isChangingPlan, setIsChangingPlan] = useState(false);
    const [columnOrder, setColumnOrder] = useState(() => {
      try {
        const raw = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
        if (!raw) return DEFAULT_COLUMN_ORDER;
        const parsed = JSON.parse(raw);
        return isValidColumnOrder(parsed) ? parsed : DEFAULT_COLUMN_ORDER;
      } catch {
        return DEFAULT_COLUMN_ORDER;
      }
    });
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [dropTargetColumn, setDropTargetColumn] = useState(null);
    const branchesRequestRef = useRef(0);
    const simsRequestRef = useRef(0);
    const canEdit = ['admin', 'manager'].includes(userRole);
    const canDelete = ['admin'].includes(userRole);
    const canAdd = ['admin', 'manager'].includes(userRole);
    const canSell = ['admin', 'manager', 'operator'].includes(userRole);
    const canRunTransactions = ['admin', 'manager', 'operator'].includes(userRole);
    const canBatch = canDelete;
    const canManageBranch = userRole === 'admin';
    const filteredSIMs = (useServerPagination ? serverSims : sims).filter(sim => {
      if (useServerPagination) {
        return true;
      }
        const matchesSearch = sim.iccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sim.msisdn && sim.msisdn.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sim.assignedTo && sim.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sim.branchName && sim.branchName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || sim.status === statusFilter;
        const matchesBranch = branchFilter === 'all' || String(sim.branchId || 'none') === branchFilter;
        return matchesSearch && matchesStatus && matchesBranch;
    });
    const totalPages = useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredSIMs.length / pageSize));
    const safeCurrentPage = useServerPagination
      ? Math.min(serverPagination.currentPage || currentPage, totalPages)
      : Math.min(currentPage, totalPages);
    const startIndex = useServerPagination
      ? (safeCurrentPage - 1) * (serverPagination.pageSize || pageSize)
      : (safeCurrentPage - 1) * pageSize;
    const paginatedSIMs = useServerPagination ? filteredSIMs : filteredSIMs.slice(startIndex, startIndex + pageSize);

    useEffect(() => {
      let isActive = true;

      const loadBranches = async () => {
        if (!canManageBranch) {
          setBranches([]);
          return;
        }

        const requestId = ++branchesRequestRef.current;

        try {
          const nextBranches = [];
          let page = 1;
          let hasNext = true;

          while (hasNext) {
            const response = await apiRequestWithMeta(`${ENDPOINTS.branches.list}?page=${page}&pageSize=100`);
            if (!isActive || requestId !== branchesRequestRef.current) {
              return;
            }

            nextBranches.push(...(response.data || []).map((branch) => ({
              id: String(branch.id ?? branch.branch_id),
              name: branch.name,
            })));

            hasNext = Boolean(response.pagination?.hasNext);
            page += 1;
          }

          if (isActive && requestId === branchesRequestRef.current) {
            setBranches(nextBranches);
          }
        }
        catch {
          if (isActive && requestId === branchesRequestRef.current) {
            setBranches([]);
          }
        }
      };

      loadBranches();

      return () => {
        isActive = false;
      };
    }, [canManageBranch]);

    const refreshSelectedSim = async (simId) => {
      if (!simId) {
        return;
      }

      try {
        const remoteSim = await apiRequest(ENDPOINTS.sims.byId(simId));
        if (remoteSim) {
          setSelectedSIM(mapSim(remoteSim));
        }
      }
      catch {
        // keep existing selected SIM if refresh fails
      }
    };

    useEffect(() => {
      const loadServerSims = async () => {
        if (!useServerPagination) {
          return;
        }

        const requestId = ++simsRequestRef.current;

        try {
          setLoading(true);
          const params = new URLSearchParams({
            page: String(currentPage),
            pageSize: String(pageSize),
          });
          if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
          }
          if (statusFilter !== 'all') {
            params.set('status', statusFilter);
          }
          if (branchFilter !== 'all') {
            params.set('branchId', branchFilter);
          }
          const response = await apiRequestWithMeta(`${ENDPOINTS.sims.list}?${params.toString()}`);
          if (requestId !== simsRequestRef.current) {
            return;
          }

          const pagination = response.pagination || { currentPage, pageSize, totalPages: 1, totalRecords: 0 };
          setServerSims((response.data || []).map(mapSim));
          setServerPagination(pagination);
          if (pagination.currentPage && pagination.currentPage !== currentPage) {
            setCurrentPage(pagination.currentPage);
          }
        }
        finally {
          if (requestId === simsRequestRef.current) {
            setLoading(false);
          }
        }
      };

      loadServerSims();
    }, [branchFilter, currentPage, searchTerm, statusFilter, useServerPagination, pageSize, sims, reloadKey]);

    useEffect(() => {
      const loadSimHistory = async () => {
        if (!selectedSIM?.id) {
          setHistoryEvents([]);
          return;
        }

        try {
          setHistoryLoading(true);
          const events = await backendApi.getSimLifecycleHistory(selectedSIM.id);
          setHistoryEvents(Array.isArray(events) ? events : []);
        }
        catch {
          setHistoryEvents([]);
        }
        finally {
          setHistoryLoading(false);
        }
      };

      loadSimHistory();
    }, [selectedSIM?.id]);

    useEffect(() => {
      let isActive = true;

      const syncSelectedSimFromRoute = async () => {
        if (!selectedSimId) {
          setSelectedSIM(null);
          return;
        }

        const localMatch = [...serverSims, ...sims].find((sim) => String(sim.id) === String(selectedSimId));
        if (localMatch) {
          setSelectedSIM(localMatch);
          return;
        }

        try {
          const remoteSim = await apiRequest(ENDPOINTS.sims.byId(selectedSimId));
          if (isActive && remoteSim) {
            setSelectedSIM(mapSim(remoteSim));
          }
        }
        catch {
          if (isActive) {
            setSelectedSIM(null);
          }
        }
      };

      syncSelectedSimFromRoute();

      return () => {
        isActive = false;
      };
    }, [selectedSimId, serverSims, sims]);

    useEffect(() => {
      setHistoryPage(1);
      setCustomerHistoryOpen(false);
      setLifecycleHistoryOpen(false);
    }, [selectedSIM?.id]);

    useEffect(() => {
      try {
        window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      } catch {
        // ignore storage errors
      }
    }, [columnOrder]);

    const HISTORY_PAGE_SIZE = 3;
    const totalHistoryPages = Math.max(1, Math.ceil(historyEvents.length / HISTORY_PAGE_SIZE));
    const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
    const historyStartIndex = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
    const paginatedHistoryEvents = historyEvents.slice(historyStartIndex, historyStartIndex + HISTORY_PAGE_SIZE);

    const hasCustomer = Boolean(selectedSIM?.assignedTo);
    const customerLifecycleEvents = historyEvents.filter((event) => {
      const type = String(event?.event_type || '').toLowerCase();
      return type === 'owner_change' || type === 'plan_change' || type === 'status_change' || type === 'msisdn_attach' || type === 'msisdn_detach';
    });
    const allVisibleSelected = paginatedSIMs.length > 0 && paginatedSIMs.every((sim) => selectedIds.includes(sim.id));
    const handleDelete = (id) => {
        setSimToDelete(id);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = () => {
        if (simToDelete) {
            onDelete(simToDelete);
            setDeleteConfirmOpen(false);
            setSimToDelete(null);
        }
    };
    const handleView = (sim) => {
      if (typeof onOpenSimDetail === 'function') {
        onOpenSimDetail(sim.id);
        return;
      }
        setSelectedSIM(sim);
    };
    const handleSell = (sim) => {
        if (onSell && sim.status === 'inactive') {
            onSell(sim);
        }
    };
    const toggleSelected = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };
    const toggleSelectAllVisible = () => {
        if (allVisibleSelected) {
            setSelectedIds((prev) => prev.filter((id) => !paginatedSIMs.some((sim) => sim.id === id)));
            return;
        }
        const visibleIds = paginatedSIMs.map((sim) => sim.id);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    };
    const handleBulkDelete = async () => {
        if (!selectedIds.length || !onBulkDelete)
            return;
        const success = await onBulkDelete(selectedIds);
        if (success) {
            setSelectedIds([]);
        }
    };
    const handleBulkBranchChange = async () => {
      if (!selectedIds.length || !onBulkUpdateBranch || !bulkBranchId) {
        return;
      }
      const success = await onBulkUpdateBranch(selectedIds, bulkBranchId);
      if (success) {
        setSelectedIds([]);
        setBulkBranchId('');
      }
    };

    const openAddBalanceModal = () => {
      if (!selectedSIM) {
        return;
      }
      if (!selectedSIM.customerId) {
        toast.error('Cannot add balance to an unassigned SIM');
        return;
      }
      setBalanceAmount('');
      setIsAddBalanceOpen(true);
    };

    const handleAddBalance = async () => {
      if (!selectedSIM) {
        return;
      }

      const amount = Number.parseFloat(balanceAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('Please enter a valid amount greater than 0');
        return;
      }

      const effectiveBranchId = branchId || selectedSIM.branchId;
      if (!userId || !effectiveBranchId || !selectedSIM.customerId) {
        toast.error('Missing required context (user, branch, or customer)');
        return;
      }

      try {
        setIsAddingBalance(true);
        await addBalanceToSim({
          userId,
          branchId: effectiveBranchId,
          customerId: selectedSIM.customerId,
          simId: selectedSIM.id,
          amount,
        });

        toast.success('Balance added successfully');
        setIsAddBalanceOpen(false);
        setBalanceAmount('');
        await refreshSelectedSim(selectedSIM.id);
        setReloadKey((prev) => prev + 1);
      }
      catch (error) {
        toast.error(error?.message || 'Failed to add balance');
      }
      finally {
        setIsAddingBalance(false);
      }
    };

    const openChangePlanModal = () => {
      if (!selectedSIM) {
        return;
      }
      if (selectedSIM.status !== 'active') {
        toast.error('Plan can only be changed for active SIMs');
        return;
      }
      setSelectedPlanId(selectedSIM.planId ? String(selectedSIM.planId) : '');
      setIsChangePlanOpen(true);
    };

    const handleChangePlan = async () => {
      if (!selectedSIM) {
        return;
      }

      const nextPlanId = Number(selectedPlanId);
      if (!Number.isFinite(nextPlanId)) {
        toast.error('Please select a valid plan');
        return;
      }

      if (String(selectedSIM.planId || '') === String(nextPlanId)) {
        toast.error('This SIM already has the selected plan');
        return;
      }

      try {
        setIsChangingPlan(true);
        await assignPlanToSim({
          simId: selectedSIM.id,
          planId: nextPlanId,
          assignedBy: userId,
        });

        const selectedPlan = plans.find((plan) => String(plan.id) === String(nextPlanId));
        toast.success(`Plan changed to ${selectedPlan?.name || `Plan #${nextPlanId}`}`);

        setIsChangePlanOpen(false);
        setSelectedPlanId('');
        await refreshSelectedSim(selectedSIM.id);
        setReloadKey((prev) => prev + 1);
      }
      catch (error) {
        toast.error(error?.message || 'Failed to change plan');
      }
      finally {
        setIsChangingPlan(false);
      }
    };
    const getSimLabel = (sim) => {
      const suffix = sim.iccid ? String(sim.iccid).slice(-6) : '';
      if (sim.id && suffix) {
        return `SIM #${sim.id} • ICCID ending ${suffix}`;
      }
      if (sim.id) {
        return `SIM #${sim.id}`;
      }
      return sim.iccid || 'SIM';
    };

    const handleColumnDragStart = (columnId) => (event) => {
      setDraggedColumn(columnId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnId);
    };
    const handleColumnDragOver = (columnId) => (event) => {
      event.preventDefault();
      if (dropTargetColumn !== columnId) setDropTargetColumn(columnId);
    };
    const handleColumnDrop = (targetColumnId) => (event) => {
      event.preventDefault();
      const sourceColumnId = draggedColumn || event.dataTransfer.getData('text/plain');
      if (!sourceColumnId || sourceColumnId === targetColumnId) {
        setDropTargetColumn(null);
        return;
      }
      setColumnOrder((currentOrder) => {
        const fromIndex = currentOrder.indexOf(sourceColumnId);
        const toIndex = currentOrder.indexOf(targetColumnId);
        if (fromIndex === -1 || toIndex === -1) return currentOrder;
        const updatedOrder = [...currentOrder];
        const [movedColumn] = updatedOrder.splice(fromIndex, 1);
        updatedOrder.splice(toIndex, 0, movedColumn);
        return updatedOrder;
      });
      setDraggedColumn(null);
      setDropTargetColumn(null);
    };
    const handleColumnDragEnd = () => {
      setDraggedColumn(null);
      setDropTargetColumn(null);
    };

    const columns = getColumns({
      canSell,
      canEdit,
      canDelete,
      onSell: handleSell,
      onEdit,
      handleDelete,
    });
    return (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
            <input type="text" placeholder="Search SIMs..." value={searchTerm} onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4"/>
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
        }}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
            setStatusFilter('active');
            setCurrentPage(1);
        }}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
            setStatusFilter('suspend');
            setCurrentPage(1);
        }}>Suspend</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
            setStatusFilter('deactivate');
            setCurrentPage(1);
        }}>Deactivated</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
            setStatusFilter('inactive');
            setCurrentPage(1);
        }}>Inactive (Stock)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canManageBranch && (<select value={branchFilter} onChange={(event) => {
            setBranchFilter(event.target.value);
            setCurrentPage(1);
          }} className="h-10 rounded-lg border border-[#c9c7c7] bg-white px-3 text-sm text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]" aria-label="Filter by branch">
              <option value="all">All Branches</option>
              <option value="none">Unassigned Branch</option>
              {branches.map((branch) => (<option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>))}
            </select>)}
        </div>
        {canAdd && (<Button onClick={onAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            <Plus className="w-4 h-4 mr-2"/>
            Add SIM
          </Button>)}
      </div>

      {canBatch && (<div className="px-4 pb-4 border-b border-[#f3f3f3] flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#828282]">Selected: {selectedIds.length}</span>
          {/* <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('active')} disabled={!selectedIds.length}>Set Active</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('suspended')} disabled={!selectedIds.length}>Set Suspended</Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('inactive')} disabled={!selectedIds.length}>Set Inactive</Button> */}
          <select value={bulkBranchId} onChange={(event) => setBulkBranchId(event.target.value)} className="h-8 rounded-md border border-[#c9c7c7] bg-white px-2 text-xs text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]" aria-label="Bulk select branch">
            <option value="">Select branch</option>
            {branches.map((branch) => (<option key={branch.id} value={branch.id}>
                {branch.name}
              </option>))}
          </select>
          <Button variant="outline" size="sm" onClick={handleBulkBranchChange} disabled={!selectedIds.length || !bulkBranchId}>Set Branch</Button>
          <Button variant="outline" size="sm" className="text-[#e9423a]" onClick={handleBulkDelete} disabled={!selectedIds.length}>Delete Selected</Button>
        </div>)}

      {selectedSIM ? (<div className="p-4 border-t border-[#f3f3f3] space-y-4">
              <div className="space-y-2">
                <BackButton onClick={() => {
                if (typeof onCloseSimDetail === 'function') {
                  onCloseSimDetail();
                  return;
                }
                setSelectedSIM(null);
              }} label="Back to SIM Grid"/>
                <h3 className="text-base font-semibold text-[#1f1f1f]">SIM Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#828282]">ICCID</p>
                  <p className="text-sm font-mono text-[#1f1f1f]">{selectedSIM.iccid}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">MSISDN (Phone)</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedSIM.msisdn || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Status</p>
                  <StatusBadge status={selectedSIM.status}/>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Customer</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedSIM.assignedTo || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Plan</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedSIM.planId ? 'Assigned' : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Branch</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedSIM.branchName || 'No branch'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Created</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedSIM.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f3f3f3] flex flex-wrap gap-2">
                {canRunTransactions && (
                  <Button
                    size="sm"
                    onClick={openAddBalanceModal}
                    className="bg-[#5b93ff] hover:bg-[#5b93ff]/90 text-white"
                  >
                    Add Balance
                  </Button>
                )}
                {canRunTransactions && selectedSIM.status === 'active' && (
                  <Button
                    size="sm"
                    onClick={openChangePlanModal}
                    className="bg-[#f6a94c] hover:bg-[#f6a94c]/90 text-white"
                  >
                    Change Plan
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t border-[#f3f3f3]">
                <div className="mb-3 rounded-md border border-[#f3f3f3] p-2">
                  <button type="button" onClick={() => setLifecycleHistoryOpen((prev) => !prev)} className="w-full flex items-center justify-between text-left">
                    <span className="text-sm font-medium text-[#1f1f1f]">Lifecycle History</span>
                    <span className="text-xs text-[#828282]">{lifecycleHistoryOpen ? 'Hide' : `Show (${historyEvents.length})`}</span>
                  </button>
                </div>
                {hasCustomer && (<div className="mb-3 rounded-md border border-[#f3f3f3] p-2">
                    <button type="button" onClick={() => setCustomerHistoryOpen((prev) => !prev)} className="w-full flex items-center justify-between text-left">
                      <span className="text-sm font-medium text-[#1f1f1f]">Customer Lifecycle: {selectedSIM.assignedTo}</span>
                      <span className="text-xs text-[#828282]">{customerHistoryOpen ? 'Hide' : 'Show'}</span>
                    </button>
                    {customerHistoryOpen && (<div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                        {customerLifecycleEvents.length === 0 ? (<p className="text-xs text-[#828282]">No customer lifecycle events yet.</p>) : (customerLifecycleEvents.map((event, index) => {
                        const eventDate = event?.event_date ? new Date(event.event_date) : null;
                        const formattedDate = eventDate && !Number.isNaN(eventDate.getTime())
                          ? eventDate.toLocaleString()
                          : 'Unknown date';

                        return (<div key={`customer-event-${event.event_type || 'event'}-${event.event_date || ''}-${index}`} className="rounded-md border border-[#f3f3f3] p-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-[#1f1f1f]">{event.summary}</p>
                                <p className="text-xs text-[#828282] whitespace-nowrap">{formattedDate}</p>
                              </div>
                              {event.details ? <p className="text-xs text-[#828282] mt-1">{event.details}</p> : null}
                              <p className="text-xs text-[#828282] mt-1">By: {event.actor || 'System'}</p>
                            </div>);
                      }))}
                      </div>)}
                  </div>)}
                {lifecycleHistoryOpen && (historyLoading ? (<p className="text-sm text-[#828282]">Loading history...</p>) : historyEvents.length === 0 ? (<p className="text-sm text-[#828282]">No history yet.</p>) : (<>
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {paginatedHistoryEvents.map((event, index) => {
                    const eventDate = event?.event_date ? new Date(event.event_date) : null;
                    const formattedDate = eventDate && !Number.isNaN(eventDate.getTime())
                      ? eventDate.toLocaleString()
                      : 'Unknown date';

                    return (<div key={`${event.event_type || 'event'}-${event.event_date || ''}-${historyStartIndex + index}`} className="rounded-md border border-[#f3f3f3] p-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-[#1f1f1f]">{event.summary}</p>
                            <p className="text-xs text-[#828282] whitespace-nowrap">{formattedDate}</p>
                          </div>
                          {event.details ? <p className="text-xs text-[#828282] mt-1">{event.details}</p> : null}
                          <p className="text-xs text-[#828282] mt-1">By: {event.actor || 'System'}</p>
                        </div>);
                  })}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-[#828282]">
                        Showing {historyEvents.length === 0 ? 0 : historyStartIndex + 1}-{Math.min(historyStartIndex + paginatedHistoryEvents.length, historyEvents.length)} of {historyEvents.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))} disabled={safeHistoryPage === 1}>
                          <ChevronLeft className="w-3 h-3"/>
                        </Button>
                        <span className="text-xs text-[#828282]">{safeHistoryPage}/{totalHistoryPages}</span>
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))} disabled={safeHistoryPage === totalHistoryPages}>
                          <ChevronRight className="w-3 h-3"/>
                        </Button>
                      </div>
                    </div>
                  </>))}
              </div>
            </div>) : (<>
          <div className="p-4 space-y-3">
            {canBatch && (<div className="flex items-center gap-2">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 accent-[#1f1f1f]"/>
                <p className="text-sm text-[#828282]">Select all on this page</p>
              </div>)}

            {loading && (<div className="text-sm text-[#828282]">Loading SIMs...</div>)}

            {!loading && paginatedSIMs.length === 0 ? (<div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-6 text-sm text-[#828282] text-center">
                No SIMs found.
              </div>) : (<div className="rounded-lg border border-[#f3f3f3] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-[#f9f9f9] border-b border-[#f3f3f3]">
                      <tr>
                        {canBatch && (
                          <th className="text-left text-xs font-medium text-[#828282] px-3 py-3 w-10">
                            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 accent-[#1f1f1f]" aria-label="Select all on this page"/>
                          </th>
                        )}
                        {columnOrder.map((columnId) => (
                          <th
                            key={columnId}
                            draggable
                            onDragStart={handleColumnDragStart(columnId)}
                            onDragOver={handleColumnDragOver(columnId)}
                            onDrop={handleColumnDrop(columnId)}
                            onDragEnd={handleColumnDragEnd}
                            className={`text-left text-xs font-medium text-[#828282] px-3 py-3 cursor-move whitespace-nowrap transition-all duration-200 ${columnId === 'actions' ? 'text-right' : ''} ${draggedColumn === columnId ? 'opacity-60 scale-[0.98]' : ''} ${dropTargetColumn === columnId ? 'bg-[#f0f0f0]' : ''}`}
                          >
                            {columns[columnId].label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSIMs.map((sim) => (
                        <tr key={sim.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] cursor-pointer" onClick={() => handleView(sim)} onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleView(sim);
                          }
                        }} tabIndex={0} role="button">
                          {canBatch && (
                            <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                              <input type="checkbox" checked={selectedIds.includes(sim.id)} onChange={() => toggleSelected(sim.id)} className="h-4 w-4 accent-[#1f1f1f]"/>
                            </td>
                          )}
                          {columnOrder.map((columnId) => {
                            // Pass getSimLabel to sim column for correct rendering
                            const cell = columnId === 'sim'
                              ? columns[columnId].renderCell(sim, getSimLabel)
                              : columns[columnId].renderCell(sim);
                            if (!isValidElement(cell)) return null;
                            return cloneElement(cell, { key: `${sim.id}-${columnId}` });
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>)}
          </div>

          <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
            <p className="text-sm text-[#828282]">
              Showing {filteredSIMs.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedSIMs.length, useServerPagination ? (serverPagination.totalRecords || filteredSIMs.length) : filteredSIMs.length)} of {useServerPagination ? (serverPagination.totalRecords || filteredSIMs.length) : filteredSIMs.length} SIMs
            </p>
            <div className="flex items-center gap-2">
              <select value={String(pageSize)} onChange={(event) => {
              const nextPageSize = Number(event.target.value) || 10;
              setPageSize(nextPageSize);
              setCurrentPage(1);
            }} className="h-8 rounded-md border border-[#c9c7c7] bg-white px-2 text-xs text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]" aria-label="Rows per page">
                <option value="5">5 / page</option>
                <option value="10">10 / page</option>
                <option value="50">50 / page</option>
              </select>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1}>
                <ChevronLeft className="w-4 h-4"/>
              </Button>
              <span className="text-xs text-[#828282] px-1">
                {safeCurrentPage}/{totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages}>
                <ChevronRight className="w-4 h-4"/>
              </Button>
            </div>
          </div>
        </>)}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SIM card from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#e9423a] hover:bg-[#e9423a]/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Balance</DialogTitle>
            <DialogDescription>
              Add top-up balance to this SIM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sim-balance-amount">Amount</Label>
            <Input
              id="sim-balance-amount"
              type="number"
              min="0"
              step="0.01"
              value={balanceAmount}
              onChange={(event) => setBalanceAmount(event.target.value)}
              placeholder="e.g. 10.00"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddBalanceOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddBalance} disabled={isAddingBalance}>
              {isAddingBalance ? 'Processing...' : 'Confirm Top Up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Assign a new plan for this active SIM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sim-plan-select">Plan</Label>
            <select
              id="sim-plan-select"
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="w-full rounded-md border border-[#c9c7c7] bg-white px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} (${Number(plan.price || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsChangePlanOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleChangePlan} disabled={isChangingPlan}>
              {isChangingPlan ? 'Updating...' : 'Update Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}


