import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowRightLeft, Power, Ban, ShoppingCart, User, Phone, CreditCard } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/presentation/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
const transactionIcons = {
    activation: Power,
    deactivation: Ban,
    transfer: ArrowRightLeft,
    suspension: Ban,
    sale: ShoppingCart,
};
const transactionColors = {
    activation: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
    deactivation: 'text-[#828282] bg-[#828282]/10',
    transfer: 'text-[#5b93ff] bg-[#5b93ff]/10',
    suspension: 'text-[#f6a94c] bg-[#f6a94c]/10',
    sale: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
};

  const DEFAULT_COLUMN_ORDER = ['transaction', 'iccid', 'msisdn', 'customer', 'plan', 'date', 'user', 'status'];
  const COLUMN_ORDER_STORAGE_KEY = 'column-order-legacy-transactions-table-v1';

  const isValidColumnOrder = (value) => Array.isArray(value)
    && value.length === DEFAULT_COLUMN_ORDER.length
    && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

export function TransactionsTable({ transactions }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
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
    useEffect(() => {
      try {
        window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      }
      catch {
        // ignore storage errors
      }
    }, [columnOrder]);
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.simIccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (transaction.msisdn && transaction.msisdn.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (transaction.customerName && transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.notes.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        return matchesSearch && matchesType;
    });
      const handleColumnDragStart = (columnId) => {
        return (event) => {
          setDraggedColumn(columnId);
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', columnId);
        };
      };
      const handleColumnDragOver = (event) => {
        event.preventDefault();
      };
      const handleColumnDrop = (targetColumnId) => {
        return (event) => {
        event.preventDefault();
        const sourceColumnId = draggedColumn || event.dataTransfer.getData('text/plain');
        if (!sourceColumnId || sourceColumnId === targetColumnId) {
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
        };
      };
      const handleColumnDragEnd = () => {
        setDraggedColumn(null);
      };
      const handleMoveColumn = (columnId, direction) => {
        setColumnOrder((currentOrder) => {
          const currentIndex = currentOrder.indexOf(columnId);
          if (currentIndex === -1) {
            return currentOrder;
          }
          const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
          if (targetIndex < 0 || targetIndex >= currentOrder.length) {
            return currentOrder;
          }
          const updatedOrder = [...currentOrder];
          [updatedOrder[currentIndex], updatedOrder[targetIndex]] = [updatedOrder[targetIndex], updatedOrder[currentIndex]];
          return updatedOrder;
        });
      };
      const columns = {
        transaction: {
          label: 'Transaction',
          renderCell: (transaction) => {
            const Icon = transactionIcons[transaction.type];
            return (<td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${transactionColors[transaction.type]}`}>
                <Icon className="w-4 h-4"/>
                </div>
                <div>
                <span className="text-sm text-[#1f1f1f] capitalize font-medium">{transaction.type}</span>
                <p className="text-xs text-[#828282]">#{transaction.id}</p>
                </div>
              </div>
              </td>);
          }
        },
        iccid: {
          label: 'SIM (ICCID)',
          renderCell: (transaction) => <td className="px-4 py-3 text-sm text-[#1f1f1f] font-mono">{transaction.simIccid}</td>
        },
        msisdn: {
          label: 'MSISDN',
          renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#1f1f1f]">
              {transaction.msisdn ? (<span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#828282]"/>
                {transaction.msisdn}
                </span>) : '—'}
              </td>)
        },
        customer: {
          label: 'Customer',
          renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#1f1f1f]">
              {transaction.customerName ? (<span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#828282]"/>
                {transaction.customerName}
                </span>) : '—'}
              </td>)
        },
        plan: {
          label: 'Plan',
          renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#828282]">
              {transaction.planName ? (<span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3"/>
                {transaction.planName}
                </span>) : '—'}
              </td>)
        },
        date: {
          label: 'Date',
          renderCell: (transaction) => (<td className="px-4 py-3 text-sm text-[#828282]">
              {transaction.date.toLocaleDateString()}
              </td>)
        },
        user: {
          label: 'User',
          renderCell: (transaction) => <td className="px-4 py-3 text-sm text-[#1f1f1f]">{transaction.userName}</td>
        },
        status: {
          label: 'Status',
          renderCell: (transaction) => (<td className="px-4 py-3">
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
              <DropdownMenuItem onClick={() => setTypeFilter('sale')}>Sale</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('activation')}>Activation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('deactivation')}>Deactivation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('transfer')}>Transfer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('suspension')}>Suspension</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f3f3f3]">
              {columnOrder.map((columnId, index) => (<th key={columnId} draggable onDragStart={handleColumnDragStart(columnId)} onDragOver={handleColumnDragOver} onDrop={handleColumnDrop(columnId)} onDragEnd={handleColumnDragEnd} className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f] cursor-move whitespace-nowrap">
                  <div className="flex items-center justify-between gap-2">
                    <span>{columns[columnId].label}</span>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" draggable={false} disabled={index === 0} onClick={() => handleMoveColumn(columnId, 'left')} className="h-5 w-5">
                        <ChevronLeft className="h-3 w-3"/>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" draggable={false} disabled={index === columnOrder.length - 1} onClick={() => handleMoveColumn(columnId, 'right')} className="h-5 w-5">
                        <ChevronRight className="h-3 w-3"/>
                      </Button>
                    </div>
                  </div>
                </th>))}
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (<tr key={transaction.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors">
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
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
        <p className="text-sm text-[#828282]">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </div>
    </div>);
}

