import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/presentation/components/ui/dialog';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Power,
  Ban,
  ShoppingCart,
  User,
  Phone,
  CreditCard,
  Wallet,
  RotateCcw,
  Activity,
  X,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '@/presentation/components/ui/button';
import { Loading } from '@/presentation/components/ui/Loading';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapTransaction } from '@/data/services/backendApi/mappers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';

// Constants
const transactionIcons = {
  activation: Power,
  reactivate: Power,
  deactivation: Ban,
  transfer: ArrowRightLeft,
  suspension: Ban,
  sale: ShoppingCart,
  top_up: Wallet,
  refund: RotateCcw,
  charge_plan: CreditCard,
};

const transactionColors = {
  activation: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
  reactivate: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
  deactivation: 'text-[#828282] bg-[#828282]/10',
  transfer: 'text-[#5b93ff] bg-[#5b93ff]/10',
  suspension: 'text-[#f6a94c] bg-[#f6a94c]/10',
  sale: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
  top_up: 'text-[#5b93ff] bg-[#5b93ff]/10',
  refund: 'text-[#e9423a] bg-[#e9423a]/10',
  charge_plan: 'text-[#5b93ff] bg-[#5b93ff]/10',
};

const DEFAULT_COLUMN_ORDER = [
  'transaction',
  'iccid',
  'msisdn',
  'customer',
  'plan',
  'date',
  'user',
  'status',
];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-transactions-table-v1';
const ITEMS_PER_PAGE = 10;

// Utility functions (pure, outside component)
const getLocalDateString = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = (dateValue) => {
  const date = new Date(dateValue);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatTransactionType = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Resolve display type for transactions. Some backends record a "sale" for
// reactivations or include notes mentioning reactivation. Prefer explicit
// 'reactivate' when detectable so the UI differentiates real sales vs reactivations.
const resolveDisplayType = (transaction) => {
  const raw = String(transaction?.type || '').toLowerCase();
  const notes = String(transaction?.notes || '').toLowerCase();

  if (raw === 'sale') {
    if (notes.includes('reactivat') || notes.includes('reactiv') || notes.includes('reactivate')) {
      return 'reactivate';
    }
    return 'sale';
  }

  // Normalize common variants
  if (raw === 'activation') return 'reactivate';
  if (raw === 'deactivation' || raw === 'deactivate') return 'deactivate';

  return raw || 'sale';
};

const isValidColumnOrder = (value) =>
  Array.isArray(value) &&
  value.length === DEFAULT_COLUMN_ORDER.length &&
  DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

// Transaction Detail Modal (extracted for clarity)
function TransactionDetailModal({ transaction, open, onOpenChange }) {
  if (!transaction) return null;

  const displayType = resolveDisplayType(transaction);
  const Icon = transactionIcons[displayType] || ShoppingCart;
  const iconColorClass =
    transactionColors[displayType] || 'bg-[#f3f3f3] text-[#828282]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Detailed information for transaction #{transaction.id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorClass}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-[#1f1f1f]">
                {formatTransactionType(displayType)}
              </div>
              <div className="text-xs text-[#828282]">ID: {transaction.id}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-[#828282]">SIM (ICCID): </span>
              {transaction.simIccid}
            </div>
            <div>
              <span className="font-medium text-[#828282]">MSISDN: </span>
              {transaction.msisdn || '—'}
            </div>
            <div>
              <span className="font-medium text-[#828282]">Customer: </span>
              {transaction.customerName || '—'}
            </div>
            <div>
              <span className="font-medium text-[#828282]">Plan: </span>
              {transaction.planName || '—'}
            </div>
            <div>
              <span className="font-medium text-[#828282]">User: </span>
              {transaction.userName}
            </div>
            <div>
              <span className="font-medium text-[#828282]">Date: </span>
              {transaction.date?.toLocaleString?.() || transaction.date}
            </div>
            <div>
              <span className="font-medium text-[#828282]">Status: </span>
              <StatusBadge status={transaction.status} type="transaction" />
            </div>
            {transaction.amount !== undefined && (
              <div>
                <span className="font-medium text-[#828282]">Amount: </span>
                {transaction.amount}
              </div>
            )}
            {transaction.notes && (
              <div className="col-span-2">
                <span className="font-medium text-[#828282]">Notes: </span>
                {transaction.notes}
              </div>
            )}
          </div>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full">
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionsTable({
  transactions = [],
  useServerPagination = false,
  disablePagination = false,
}) {
  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilterMode, setDateFilterMode] = useState('today');
  const todayDate = useMemo(() => getLocalDateString(new Date()), []);
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [currentPage, setCurrentPage] = useState(1);

  // Server state
  const [serverTransactions, setServerTransactions] = useState([]);
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    pageSize: ITEMS_PER_PAGE,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const transactionsRequestRef = useRef(0);

  // Column reordering
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

  // Memoized date range resolver
  const resolveDateRange = useCallback(
    (mode, customDate) => {
      if (mode === 'all') {
        return { start: null, end: null, single: '' };
      }
      if (mode === 'custom') {
        return { start: null, end: null, single: customDate || todayDate };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (mode === 'week') {
        return { start: startOfWeek(today), end: today, single: '' };
      }
      if (mode === 'month') {
        return { start: startOfMonth(today), end: today, single: '' };
      }
      // 'today'
      return { start: today, end: today, single: todayDate };
    },
    [todayDate]
  );

  const dateRange = useMemo(
    () => resolveDateRange(dateFilterMode, dateFilter),
    [resolveDateRange, dateFilterMode, dateFilter]
  );

  // Helper: matches date filter (pure)
  const matchesDateFilter = useCallback(
    (value, range) => {
      if (!range || (!range.single && !range.start && !range.end)) return true;
      if (!value) return false;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return false;
      parsed.setHours(0, 0, 0, 0);
      if (range.single) {
        return getLocalDateString(parsed) === range.single;
      }
      if (range.start && parsed < range.start) return false;
      if (range.end && parsed > range.end) return false;
      return true;
    },
    []
  );

  // Fetch server data
  useEffect(() => {
    if (!useServerPagination) return;

    const fetchTransactions = async () => {
      const requestId = ++transactionsRequestRef.current;
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(ITEMS_PER_PAGE),
        });
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (dateRange.single) {
          params.set('date', dateRange.single);
        } else if (dateRange.start || dateRange.end) {
          if (dateRange.start) {
            params.set('startDate', getLocalDateString(dateRange.start));
          }
          if (dateRange.end) {
            params.set('endDate', getLocalDateString(dateRange.end));
          }
        }

        const response = await apiRequestWithMeta(
          `${ENDPOINTS.transactions.list}?${params.toString()}`
        );

        if (requestId !== transactionsRequestRef.current) return;

        const pagination = response.pagination || {
          currentPage,
          pageSize: ITEMS_PER_PAGE,
          totalPages: 1,
          totalRecords: 0,
        };
        setServerTransactions((response.data || []).map(mapTransaction));
        setServerPagination(pagination);

        // Only sync currentPage if it's out of valid range (avoid loops)
        
        if (pagination.currentPage && pagination.currentPage !== currentPage) {
          // If API returns a different page, adjust only if it's not the one we requested?
          // Safer: only adjust if currentPage > totalPages
          if (currentPage > pagination.totalPages) {
            setCurrentPage(pagination.totalPages || 1);
          }
        }
      } catch (err) {
        if (requestId === transactionsRequestRef.current) {
          setError(err.message || 'Failed to load transactions');
        }
      } finally {
        if (requestId === transactionsRequestRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    typeFilter,
    useServerPagination,
    dateRange,
  ]);

  // Determine source data
  const sourceTransactions = useServerPagination
    ? serverTransactions
    : transactions;

  // Memoized available types for filter dropdown
  const availableTypes = useMemo(() => {
    if (useServerPagination) {
      return Array.from(
        new Set(sourceTransactions.map((t) => t.type).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
    }

    // For local data, expose the resolved display types so users can
    // filter by 'Reactivate' when a sale actually represents a reactivation.
    return Array.from(
      new Set(sourceTransactions.map((t) => resolveDisplayType(t)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [sourceTransactions, useServerPagination]);

  // Local filtering (only when not using server pagination)
  const filteredTransactions = useMemo(() => {
    if (useServerPagination) return sourceTransactions;

    return sourceTransactions.filter((transaction) => {
      const matchesSearch =
        (transaction.simIccid &&
          transaction.simIccid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.msisdn &&
          transaction.msisdn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.customerName &&
          transaction.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (transaction.userName &&
          transaction.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.notes &&
          transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        typeFilter === 'all' ||
        (useServerPagination
          ? transaction.type === typeFilter
          : resolveDisplayType(transaction) === typeFilter);
      const matchesStatus =
        statusFilter === 'all' || transaction.status === statusFilter;
      const matchesDate = matchesDateFilter(transaction.date, dateRange);

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [
    sourceTransactions,
    useServerPagination,
    searchTerm,
    typeFilter,
    statusFilter,
    dateRange,
    matchesDateFilter,
  ]);

  // Pagination calculations
  const totalPages = disablePagination
    ? 1
    : useServerPagination
    ? Math.max(serverPagination.totalPages || 1, 1)
    : Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));

  const safeCurrentPage = disablePagination
    ? 1
    : useServerPagination
    ? Math.min(serverPagination.currentPage || currentPage, totalPages)
    : Math.min(currentPage, totalPages);

  const startIndex = disablePagination
    ? 0
    : useServerPagination
    ? (safeCurrentPage - 1) * (serverPagination.pageSize || ITEMS_PER_PAGE)
    : (safeCurrentPage - 1) * ITEMS_PER_PAGE;

  const paginatedTransactions = disablePagination
    ? filteredTransactions
    : useServerPagination
    ? filteredTransactions
    : filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFilter, dateFilterMode]);

  // Correct page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  // Persist column order
  useEffect(() => {
    try {
      window.localStorage.setItem(
        COLUMN_ORDER_STORAGE_KEY,
        JSON.stringify(columnOrder)
      );
    } catch {
      // ignore
    }
  }, [columnOrder]);

  // Drag handlers
  const handleColumnDragStart = useCallback(
    (columnId) => (event) => {
      setDraggedColumn(columnId);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnId);
    },
    []
  );

  const handleColumnDragOver = useCallback((columnId) => (event) => {
    event.preventDefault();
    if (dropTargetColumn !== columnId) {
      setDropTargetColumn(columnId);
    }
  }, [dropTargetColumn]);

  const handleColumnDrop = useCallback(
    (targetColumnId) => (event) => {
      event.preventDefault();
      const sourceColumnId =
        draggedColumn || event.dataTransfer.getData('text/plain');
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
    },
    [draggedColumn]
  );

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumn(null);
    setDropTargetColumn(null);
  }, []);

  // Columns definition (memoized)
  const columns = useMemo(
    () => ({
      transaction: {
        label: 'Transaction',
        renderCell: (transaction) => {
          const displayType = resolveDisplayType(transaction);
          const Icon = transactionIcons[displayType] || ShoppingCart;
          const iconColor =
            transactionColors[displayType] ||
            'text-[#828282] bg-[#828282]/10';
          return (
            <td
              className="px-4 py-3 transition-all duration-200"
              key={`${transaction.id}-transaction`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm text-[#1f1f1f] font-medium">
                    {formatTransactionType(displayType)}
                  </span>
                  <p className="text-xs text-[#828282]">#{transaction.id}</p>
                </div>
              </div>
            </td>
          );
        },
      },
      iccid: {
        label: 'SIM (ICCID)',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#1f1f1f] font-mono transition-all duration-200"
            key={`${transaction.id}-iccid`}
          >
            {transaction.simIccid}
          </td>
        ),
      },
      msisdn: {
        label: 'MSISDN',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200"
            key={`${transaction.id}-msisdn`}
          >
            {transaction.msisdn ? (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#828282]" />
                {transaction.msisdn}
              </span>
            ) : (
              '—'
            )}
          </td>
        ),
      },
      customer: {
        label: 'Customer',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200"
            key={`${transaction.id}-customer`}
          >
            {transaction.customerName ? (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#828282]" />
                {transaction.customerName}
              </span>
            ) : (
              '—'
            )}
          </td>
        ),
      },
      plan: {
        label: 'Plan',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#828282] transition-all duration-200"
            key={`${transaction.id}-plan`}
          >
            {transaction.planName ? (
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {transaction.planName}
              </span>
            ) : (
              '—'
            )}
          </td>
        ),
      },
      date: {
        label: 'Date',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#828282] transition-all duration-200"
            key={`${transaction.id}-date`}
          >
            {transaction.date
              ? transaction.date.toLocaleDateString?.() || transaction.date
              : 'N/A'}
          </td>
        ),
      },
      user: {
        label: 'User',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200"
            key={`${transaction.id}-user`}
          >
            {transaction.userName}
          </td>
        ),
      },
      status: {
        label: 'Status',
        renderCell: (transaction) => (
          <td
            className="px-4 py-3 transition-all duration-200"
            key={`${transaction.id}-status`}
          >
            <StatusBadge status={transaction.status} type="transaction" />
          </td>
        ),
      },
    }),
    []
  );

  const renderTransactionRow = useCallback(
    (transaction) =>
      columnOrder.map((columnId) => columns[columnId].renderCell(transaction)),
    [columnOrder, columns]
  );

  return (
    <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"
            />
          </div>

          {/* Type filter dropdown with current selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {typeFilter === 'all'
                  ? 'All Types'
                  : formatTransactionType(typeFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All Types
              </DropdownMenuItem>
              {availableTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  {formatTransactionType(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter dropdown with current selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                {statusFilter === 'all'
                  ? 'All Status'
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                Failed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date filter controls */}
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-[#c9c7c7] bg-white px-2 text-sm"
              value={dateFilterMode}
              onChange={(event) => setDateFilterMode(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
              <option value="all">All</option>
            </select>
            <input
              type="date"
              className="h-9 rounded-md border border-[#c9c7c7] bg-white px-2 text-sm"
              value={dateFilter}
              onChange={(event) => {
                setDateFilterMode('custom');
                setDateFilter(event.target.value);
              }}
            />
            {dateFilterMode === 'custom' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setDateFilterMode('today');
                  setDateFilter(todayDate);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Reset column order button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setColumnOrder(DEFAULT_COLUMN_ORDER)}
          >
            Reset Columns
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f3f3f3]">
              {columnOrder.map((columnId) => (
                <th
                  key={columnId}
                  draggable
                  onDragStart={handleColumnDragStart(columnId)}
                  onDragOver={handleColumnDragOver(columnId)}
                  onDrop={handleColumnDrop(columnId)}
                  onDragEnd={handleColumnDragEnd}
                  className={`text-left px-4 py-3 text-sm font-medium text-[#828282] cursor-move whitespace-nowrap transition-all duration-200 ${
                    draggedColumn === columnId ? 'opacity-60 scale-[0.98]' : ''
                  } ${dropTargetColumn === columnId ? 'bg-[#f9f9f9]' : ''}`}
                >
                  {columns[columnId].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnOrder.length} className="p-4 text-center">
                  <Loading message="Loading transactions..." size="sm" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columnOrder.length}
                  className="p-4 text-sm text-red-500 text-center"
                >
                  Error: {error}
                  <Button
                    variant="link"
                    className="ml-2"
                    onClick={() => setCurrentPage((p) => p)} // trigger refetch
                  >
                    Retry
                  </Button>
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={columnOrder.length}
                  className="p-4 text-sm text-[#828282] text-center"
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setModalOpen(true);
                  }}
                >
                  {renderTransactionRow(transaction)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Pagination */}
      {!disablePagination && (
        <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
          <p className="text-sm text-[#828282]">
            Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}-
            {Math.min(
              startIndex + paginatedTransactions.length,
              useServerPagination
                ? serverPagination.totalRecords || filteredTransactions.length
                : filteredTransactions.length
            )}{' '}
            of{' '}
            {useServerPagination
              ? serverPagination.totalRecords || filteredTransactions.length
              : filteredTransactions.length}{' '}
            transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-[#828282] px-1">
              {safeCurrentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}