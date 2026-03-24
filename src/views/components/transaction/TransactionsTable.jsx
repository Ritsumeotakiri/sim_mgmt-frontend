import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowRightLeft, Power, Ban, ShoppingCart, User, Phone, CreditCard, Wallet, RotateCcw, Activity } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '@/components/ui/button';
import { ENDPOINTS } from '@/services/endpoints';
import { apiRequestWithMeta } from '@/services/backendApi/client';
import { mapTransaction } from '@/services/backendApi/mappers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
const transactionIcons = {
    activation: Power,
    deactivation: Ban,
    transfer: ArrowRightLeft,
    suspension: Ban,
    sale: ShoppingCart,
  top_up: Wallet,
  refund: RotateCcw,
};
const transactionColors = {
    activation: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
    deactivation: 'text-[#828282] bg-[#828282]/10',
    transfer: 'text-[#5b93ff] bg-[#5b93ff]/10',
    suspension: 'text-[#f6a94c] bg-[#f6a94c]/10',
    sale: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
  top_up: 'text-[#5b93ff] bg-[#5b93ff]/10',
  refund: 'text-[#e9423a] bg-[#e9423a]/10',
};

const DEFAULT_COLUMN_ORDER = ['transaction', 'iccid', 'msisdn', 'customer', 'plan', 'date', 'user', 'status'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-transactions-table-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_COLUMN_ORDER.length
  && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

const formatTransactionType = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
export function TransactionsTable({ transactions = [], useServerPagination = false, disablePagination = false }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
  const [serverTransactions, setServerTransactions] = useState([]);
  const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_COLUMN_ORDER;
      }
      const parsed = JSON.parse(raw);
      return isValidColumnOrder(parsed) ? parsed : DEFAULT_COLUMN_ORDER;
    }
    catch {
      return DEFAULT_COLUMN_ORDER;
    }
  });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dropTargetColumn, setDropTargetColumn] = useState(null);
  const itemsPerPage = 10;
  useEffect(() => {
    const loadTransactions = async () => {
      if (!useServerPagination)
        return;
      try {
        setLoading(true);
        const response = await apiRequestWithMeta(`${ENDPOINTS.transactions.list}?page=${currentPage}&pageSize=${itemsPerPage}`);
        setServerTransactions((response.data || []).map(mapTransaction));
        setServerPagination(response.pagination || { currentPage, pageSize: itemsPerPage, totalPages: 1, totalRecords: 0 });
      }
      finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [currentPage, useServerPagination]);
  const sourceTransactions = useServerPagination ? serverTransactions : transactions;
  const availableTypes = Array.from(new Set(sourceTransactions.map((transaction) => transaction.type).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredTransactions = sourceTransactions.filter(transaction => {
        const matchesSearch = transaction.simIccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (transaction.msisdn && transaction.msisdn.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (transaction.customerName && transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.notes.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
    });
  const totalPages = disablePagination
    ? 1
    : useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const startIndex = disablePagination
    ? 0
    : useServerPagination
      ? ((serverPagination.currentPage || currentPage) - 1) * (serverPagination.pageSize || itemsPerPage)
      : (currentPage - 1) * itemsPerPage;
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
    const columns = {
      transaction: {
        label: 'Transaction',
        renderCell: (transaction) => {
          const Icon = transactionIcons[transaction.type] || ShoppingCart;
          const iconColor = transactionColors[transaction.type] || 'text-[#828282] bg-[#828282]/10';
          return (<td className="px-4 py-3 transition-all duration-200">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
              <Icon className="w-4 h-4"/>
              </div>
              <div>
              <span className="text-sm text-[#1f1f1f] font-medium">{formatTransactionType(transaction.type)}</span>
              <p className="text-xs text-[#828282]">#{transaction.id}</p>
              </div>
            </div>
            </td>);
        }
      },
      iccid: {
        label: 'SIM (ICCID)',
        renderCell: (transaction) => <td className="px-4 py-3 text-sm text-[#1f1f1f] font-mono transition-all duration-200">{transaction.simIccid}</td>
      },
      msisdn: {
        label: 'MSISDN',
        renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            {transaction.msisdn ? (<span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#828282]"/>
              {transaction.msisdn}
              </span>) : '—'}
            </td>)
      },
      customer: {
        label: 'Customer',
        renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            {transaction.customerName ? (<span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#828282]"/>
              {transaction.customerName}
              </span>) : '—'}
            </td>)
      },
      plan: {
        label: 'Plan',
        renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">
            {transaction.planName ? (<span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3"/>
              {transaction.planName}
              </span>) : '—'}
            </td>)
      },
      date: {
        label: 'Date',
        renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{transaction.date.toLocaleDateString()}</td>)
      },
      user: {
        label: 'User',
        renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">{transaction.userName}</td>)
      },
      status: {
        label: 'Status',
        renderCell: (transaction) => (<td className="px-4 py-3 transition-all duration-200">
            <StatusBadge status={transaction.status} type="transaction"/>
            </td>)
      }
    };
    return (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
            <input type="text" placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4"/>
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>All Types</DropdownMenuItem>
                {availableTypes.map((type) => (<DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>{formatTransactionType(type)}</DropdownMenuItem>))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Activity className="w-4 h-4"/>
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
              {columnOrder.map((columnId) => (<th key={columnId} draggable onDragStart={handleColumnDragStart(columnId)} onDragOver={handleColumnDragOver(columnId)} onDrop={handleColumnDrop(columnId)} onDragEnd={handleColumnDragEnd} className={`text-left px-4 py-3 text-sm font-medium text-[#828282] cursor-move whitespace-nowrap transition-all duration-200 ${draggedColumn === columnId ? 'opacity-60 scale-[0.98]' : ''} ${dropTargetColumn === columnId ? 'bg-[#f9f9f9]' : ''}`}>
                  {columns[columnId].label}
                </th>))}
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (<tr key={transaction.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors">
                {columnOrder.map((columnId) => {
                  const cell = columns[columnId].renderCell(transaction);
                  if (!isValidElement(cell)) {
                    return null;
                  }
                  return cloneElement(cell, { key: `${transaction.id}-${columnId}` });
                })}
              </tr>))}
          </tbody>
        </table>
        {loading && (<div className="p-4 text-sm text-[#828282]">Loading transactions...</div>)}
      </div>

      {!disablePagination && (<div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
          <p className="text-sm text-[#828282]">
              Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedTransactions.length, useServerPagination ? (serverPagination.totalRecords || filteredTransactions.length) : filteredTransactions.length)} of {useServerPagination ? (serverPagination.totalRecords || filteredTransactions.length) : filteredTransactions.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4"/>
            </Button>
            <span className="text-xs text-[#828282] px-1">
              {currentPage}/{totalPages}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4"/>
            </Button>
          </div>
        </div>)}
    </div>);
}
