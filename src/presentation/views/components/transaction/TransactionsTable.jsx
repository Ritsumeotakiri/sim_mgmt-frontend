import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/presentation/components/ui/dialog';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowRightLeft, Power, Ban, ShoppingCart, User, Phone, CreditCard, Wallet, RotateCcw, Activity } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '@/presentation/components/ui/button';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapTransaction } from '@/data/services/backendApi/mappers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/presentation/components/ui/dropdown-menu';

const transactionIcons = {
  activation: Power,
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
  deactivation: 'text-[#828282] bg-[#828282]/10',
  transfer: 'text-[#5b93ff] bg-[#5b93ff]/10',
  suspension: 'text-[#f6a94c] bg-[#f6a94c]/10',
  sale: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
  top_up: 'text-[#5b93ff] bg-[#5b93ff]/10',
  refund: 'text-[#e9423a] bg-[#e9423a]/10',
  charge_plan: 'text-[#5b93ff] bg-[#5b93ff]/10',
};

const DEFAULT_COLUMN_ORDER = ['transaction', 'iccid', 'msisdn', 'customer', 'plan', 'date', 'user', 'status'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-transactions-table-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_COLUMN_ORDER.length
  && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

const formatTransactionType = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function TransactionsTable({ transactions = [], useServerPagination = false, disablePagination = false }) {
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTransactions, setServerTransactions] = useState([]);
  const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const transactionsRequestRef = useRef(0);
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_COLUMN_ORDER;
      }
      const parsed = JSON.parse(raw);
      return isValidColumnOrder(parsed) ? parsed : DEFAULT_COLUMN_ORDER;
    } catch {
      return DEFAULT_COLUMN_ORDER;
    }
  });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dropTargetColumn, setDropTargetColumn] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadTransactions = async () => {
      if (!useServerPagination) return;
      const requestId = ++transactionsRequestRef.current;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(itemsPerPage),
        });
        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim());
        }
        if (typeFilter !== 'all') {
          params.set('type', typeFilter);
        }
        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }
        const response = await apiRequestWithMeta(`${ENDPOINTS.transactions.list}?${params.toString()}`);
        if (requestId !== transactionsRequestRef.current) {
          return;
        }

        const pagination = response.pagination || { currentPage, pageSize: itemsPerPage, totalPages: 1, totalRecords: 0 };
        setServerTransactions((response.data || []).map(mapTransaction));
        setServerPagination(pagination);
        if (pagination.currentPage && pagination.currentPage !== currentPage) {
          setCurrentPage(pagination.currentPage);
        }
      } finally {
        if (requestId === transactionsRequestRef.current) {
          setLoading(false);
        }
      }
    };
    loadTransactions();
  }, [currentPage, searchTerm, statusFilter, typeFilter, useServerPagination]);

  const sourceTransactions = useServerPagination ? serverTransactions : transactions;
  const availableTypes = Array.from(new Set(sourceTransactions.map((transaction) => transaction.type).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const filteredTransactions = sourceTransactions.filter(transaction => {
    if (useServerPagination) {
      return true;
    }
    const matchesSearch = (transaction.simIccid && transaction.simIccid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.msisdn && transaction.msisdn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.customerName && transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.userName && transaction.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = disablePagination
    ? 1
    : useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  const safeCurrentPage = disablePagination
    ? 1
    : useServerPagination
      ? Math.min(serverPagination.currentPage || currentPage, totalPages)
      : Math.min(currentPage, totalPages);

  const startIndex = disablePagination
    ? 0
    : useServerPagination
      ? (safeCurrentPage - 1) * (serverPagination.pageSize || itemsPerPage)
      : (safeCurrentPage - 1) * itemsPerPage;

  const paginatedTransactions = disablePagination
    ? filteredTransactions
    : useServerPagination
      ? filteredTransactions
      : filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
    } catch {
      // ignore storage errors
    }
  }, [columnOrder]);

  const handleColumnDragStart = (columnId) => (event) => {
    setDraggedColumn(columnId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnId);
  };

  const handleColumnDragOver = (columnId) => (event) => {
    event.preventDefault();
    if (dropTargetColumn !== columnId) {
      setDropTargetColumn(columnId);
    }
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

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
    setDropTargetColumn(null);
  };

  const columns = {
    transaction: {
      label: 'Transaction',
      renderCell: (transaction) => {
        const Icon = transactionIcons[transaction.type] || ShoppingCart;
        const iconColor = transactionColors[transaction.type] || 'text-[#828282] bg-[#828282]/10';
        return (
          <td className="px-4 py-3 transition-all duration-200" key={`${transaction.id}-transaction`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm text-[#1f1f1f] font-medium">{formatTransactionType(transaction.type)}</span>
                <p className="text-xs text-[#828282]">#{transaction.id}</p>
              </div>
            </div>
          </td>
        );
      }
    },
    iccid: {
      label: 'SIM (ICCID)',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#1f1f1f] font-mono transition-all duration-200" key={`${transaction.id}-iccid`}>
          {transaction.simIccid}
        </td>
      )
    },
    msisdn: {
      label: 'MSISDN',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200" key={`${transaction.id}-msisdn`}>
          {transaction.msisdn ? (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#828282]" />
              {transaction.msisdn}
            </span>
          ) : '—'}
        </td>
      )
    },
    customer: {
      label: 'Customer',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200" key={`${transaction.id}-customer`}>
          {transaction.customerName ? (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#828282]" />
              {transaction.customerName}
            </span>
          ) : '—'}
        </td>
      )
    },
    plan: {
      label: 'Plan',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200" key={`${transaction.id}-plan`}>
          {transaction.planName ? (
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {transaction.planName}
            </span>
          ) : '—'}
        </td>
      )
    },
    date: {
      label: 'Date',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200" key={`${transaction.id}-date`}>
          {transaction.date ? (transaction.date.toLocaleDateString?.() || transaction.date) : 'N/A'}
        </td>
      )
    },
    user: {
      label: 'User',
      renderCell: (transaction) => (
        <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200" key={`${transaction.id}-user`}>
          {transaction.userName}
        </td>
      )
    },
    status: {
      label: 'Status',
      renderCell: (transaction) => (
        <td className="px-4 py-3 transition-all duration-200" key={`${transaction.id}-status`}>
          <StatusBadge status={transaction.status} type="transaction" />
        </td>
      )
    }
  };

  const renderTransactionRow = (transaction) => {
    return columnOrder.map((columnId) => {
      const cell = columns[columnId].renderCell(transaction);
      return cell;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Types</DropdownMenuItem>
              {availableTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  {formatTransactionType(type)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  className={`text-left px-4 py-3 text-sm font-medium text-[#828282] cursor-move whitespace-nowrap transition-all duration-200 ${draggedColumn === columnId ? 'opacity-60 scale-[0.98]' : ''} ${dropTargetColumn === columnId ? 'bg-[#f9f9f9]' : ''}`}
                >
                  {columns[columnId].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnOrder.length} className="p-4 text-sm text-[#828282] text-center">
                  Loading transactions...
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={columnOrder.length} className="p-4 text-sm text-[#828282] text-center">
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

      {/* Transaction Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information for transaction #{selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transactionColors[selectedTransaction.type] || 'bg-[#f3f3f3]'}`}>
                  {(() => {
                    const Icon = transactionIcons[selectedTransaction.type] || ShoppingCart;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <div className="text-base font-semibold text-[#1f1f1f]">{formatTransactionType(selectedTransaction.type)}</div>
                  <div className="text-xs text-[#828282]">ID: {selectedTransaction.id}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium text-[#828282]">SIM (ICCID): </span>{selectedTransaction.simIccid}</div>
                <div><span className="font-medium text-[#828282]">MSISDN: </span>{selectedTransaction.msisdn || '—'}</div>
                <div><span className="font-medium text-[#828282]">Customer: </span>{selectedTransaction.customerName || '—'}</div>
                <div><span className="font-medium text-[#828282]">Plan: </span>{selectedTransaction.planName || '—'}</div>
                <div><span className="font-medium text-[#828282]">User: </span>{selectedTransaction.userName}</div>
                <div><span className="font-medium text-[#828282]">Date: </span>{selectedTransaction.date?.toLocaleString?.() || selectedTransaction.date}</div>
                <div><span className="font-medium text-[#828282]">Status: </span><StatusBadge status={selectedTransaction.status} type="transaction" /></div>
                {selectedTransaction.amount !== undefined && (
                  <div><span className="font-medium text-[#828282]">Amount: </span>{selectedTransaction.amount}</div>
                )}
                {selectedTransaction.notes && (
                  <div className="col-span-2"><span className="font-medium text-[#828282]">Notes: </span>{selectedTransaction.notes}</div>
                )}
              </div>
            </div>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {!disablePagination && (
        <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
          <p className="text-sm text-[#828282]">
            Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + paginatedTransactions.length, useServerPagination ? (serverPagination.totalRecords || filteredTransactions.length) : filteredTransactions.length)} of{' '}
            {useServerPagination ? (serverPagination.totalRecords || filteredTransactions.length) : filteredTransactions.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

