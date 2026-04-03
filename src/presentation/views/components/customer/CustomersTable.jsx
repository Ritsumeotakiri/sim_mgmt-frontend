import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Mail, Phone, IdCard, Plus, Edit2, Trash2, Eye, Clock3 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapCustomer } from '@/data/services/backendApi/mappers';

const DEFAULT_COLUMN_ORDER = ['customer', 'email', 'phone', 'idNumber', 'created', 'actions'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-customers-table-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_COLUMN_ORDER.length
  && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

const EMPTY_FORM = { name: '', email: '', phone: '', idNumber: '', address: '' };

export function CustomersTable({ customers, transactions = [], sims = [], plans = [], onAdd, onEdit, onDelete, useServerPagination = false }) {
    const canAdd = typeof onAdd === 'function';
    const canEdit = typeof onEdit === 'function';
    const canDelete = typeof onDelete === 'function';
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [serverCustomers, setServerCustomers] = useState([]);
  const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const customersRequestRef = useRef(0);

    useEffect(() => {
      try {
        window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      }
      catch {
        // ignore storage errors
      }
    }, [columnOrder]);

    const filteredCustomers = (useServerPagination ? serverCustomers : customers).filter((customer) => {
        if (useServerPagination) {
          return true;
        }
        const keyword = searchTerm.toLowerCase();
        return (customer.name.toLowerCase().includes(keyword) ||
            customer.email.toLowerCase().includes(keyword) ||
            customer.phone.toLowerCase().includes(keyword) ||
            customer.idNumber.toLowerCase().includes(keyword));
    });
    const itemsPerPage = 10;
    const totalPages = useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
    const safeCurrentPage = useServerPagination
      ? Math.min(serverPagination.currentPage || currentPage, totalPages)
      : Math.min(currentPage, totalPages);
    const startIndex = useServerPagination
      ? (safeCurrentPage - 1) * (serverPagination.pageSize || itemsPerPage)
      : (safeCurrentPage - 1) * itemsPerPage;
    const paginatedCustomers = useServerPagination ? filteredCustomers : filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
      const loadServerCustomers = async () => {
        if (!useServerPagination) {
          return;
        }

        const requestId = ++customersRequestRef.current;
        try {
          setLoading(true);
          const params = new URLSearchParams({
            page: String(currentPage),
            pageSize: String(itemsPerPage),
          });
          if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
          }
          const response = await apiRequestWithMeta(`${ENDPOINTS.customers.list}?${params.toString()}`);
          if (requestId !== customersRequestRef.current) {
            return;
          }

          const pagination = response.pagination || { currentPage, pageSize: itemsPerPage, totalPages: 1, totalRecords: 0 };
          setServerCustomers((response.data || []).map(mapCustomer));
          setServerPagination(pagination);
          if (pagination.currentPage && pagination.currentPage !== currentPage) {
            setCurrentPage(pagination.currentPage);
          }
        } finally {
          if (requestId === customersRequestRef.current) {
            setLoading(false);
          }
        }
      };

      loadServerCustomers();
    }, [currentPage, searchTerm, refreshTick, useServerPagination]);
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
    const handleAdd = async () => {
      if (!onAdd)
        return;
      const success = await onAdd(formData);
      if (success !== false) {
        setIsAddModalOpen(false);
        setFormData(EMPTY_FORM);
        if (useServerPagination) {
          setRefreshTick((prev) => prev + 1);
        }
      }
    };
    const openEditModal = (customer) => {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        idNumber: customer.idNumber || '',
        address: customer.address || '',
      });
      setIsEditModalOpen(true);
    };
    const handleEdit = async () => {
      if (!onEdit || !selectedCustomer)
        return;
      const success = await onEdit({ ...selectedCustomer, ...formData });
      if (success !== false) {
        setIsEditModalOpen(false);
        setSelectedCustomer(null);
        if (useServerPagination) {
          setRefreshTick((prev) => prev + 1);
        }
      }
    };
    const handleDelete = (id) => {
      setCustomerToDelete(id);
      setDeleteConfirmOpen(true);
    };
    const handleViewDetails = (customer) => {
      setSelectedCustomer(customer);
      setDetailOpen(true);
    };
    const confirmDelete = async () => {
      if (!onDelete || !customerToDelete)
        return;
      const success = await onDelete(customerToDelete);
      if (success !== false) {
        setDeleteConfirmOpen(false);
        setCustomerToDelete(null);
        if (useServerPagination) {
          setRefreshTick((prev) => prev + 1);
        }
      }
    };
    const columns = {
      customer: {
        label: 'Customer',
        renderCell: (customer) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            <span className="flex items-center gap-2">
            <User className="w-3 h-3 text-[#828282]"/>
            {customer.name}
            </span>
          </td>)
      },
      email: {
        label: 'Email',
        renderCell: (customer) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            <span className="flex items-center gap-2">
            <Mail className="w-3 h-3 text-[#828282]"/>
            {customer.email}
            </span>
          </td>)
      },
      phone: {
        label: 'Phone',
        renderCell: (customer) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            <span className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-[#828282]"/>
            {customer.phone}
            </span>
          </td>)
      },
      idNumber: {
        label: 'ID Number',
        renderCell: (customer) => (<td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">
            <span className="flex items-center gap-2">
            <IdCard className="w-3 h-3 text-[#828282]"/>
            {customer.idNumber}
            </span>
          </td>)
      },
      created: {
        label: 'Created',
        renderCell: (customer) => <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{customer.createdAt.toLocaleDateString()}</td>
      },
      actions: {
        label: 'Actions',
        renderCell: (customer) => (<td className="px-4 py-3 transition-all duration-200">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(customer)}>
                <Eye className="w-4 h-4 text-[#828282]"/>
              </Button>
              {canEdit || canDelete ? (<>
                {canEdit && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(customer)}>
                    <Edit2 className="w-4 h-4 text-[#828282]"/>
                  </Button>)}
                {canDelete && (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(customer.id)}>
                    <Trash2 className="w-4 h-4 text-[#e9423a]"/>
                  </Button>)}
                </>) : (<span className="text-xs text-[#828282]">Read only</span>)}
            </div>
          </td>)
      }
    };
    const customerTransactions = selectedCustomer
      ? transactions
        .filter((transaction) => transaction.customerId === selectedCustomer.id || transaction.customerName === selectedCustomer.name)
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
      : [];
    const customerSims = selectedCustomer
      ? sims.filter((sim) => sim.customerId === selectedCustomer.id || sim.assignedTo === selectedCustomer.name)
      : [];
    const paymentTransactions = customerTransactions.filter((transaction) => ['sale', 'top_up', 'refund', 'charge_plan'].includes(String(transaction.type || '').toLowerCase()));
    const timelineEntries = selectedCustomer ? [
      {
        id: 'created',
        label: 'Customer account created',
        date: selectedCustomer.createdAt,
      },
      ...customerTransactions.map((transaction) => ({
        id: `tx-${transaction.id}`,
        label: `${String(transaction.type || 'transaction').replace(/_/g, ' ')} (${transaction.status})`,
        date: transaction.date,
      })),
    ].sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()) : [];
    const getTransactionAmount = (transaction) => {
      if (transaction.amount !== undefined && transaction.amount !== null) {
        return Number(transaction.amount);
      }
      if (transaction.planId) {
        const matchedPlan = plans.find((plan) => plan.id === transaction.planId);
        if (matchedPlan) {
          return Number(matchedPlan.price || 0);
        }
      }
      return null;
    };
    return (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      <div className="p-4 border-b border-[#f3f3f3] flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
          <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
        }} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
        </div>
        {canAdd && (<Button onClick={() => {
          setFormData(EMPTY_FORM);
          setIsAddModalOpen(true);
        }} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            <Plus className="w-4 h-4 mr-2"/>
            Add Customer
          </Button>)}
      </div>

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
            {paginatedCustomers.map((customer) => (<tr key={customer.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors">
                {columnOrder.map((columnId) => {
                  const cell = columns[columnId].renderCell(customer);
                  if (!isValidElement(cell)) {
                    return null;
                  }
                  return cloneElement(cell, { key: `${customer.id}-${columnId}` });
                })}
              </tr>))}
          </tbody>
        </table>
        {loading && (<div className="p-4 text-sm text-[#828282]">Loading customers...</div>)}
      </div>

      <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
        <p className="text-sm text-[#828282]">
          Showing {filteredCustomers.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedCustomers.length, useServerPagination ? (serverPagination.totalRecords || filteredCustomers.length) : filteredCustomers.length)} of {useServerPagination ? (serverPagination.totalRecords || filteredCustomers.length) : filteredCustomers.length} customers
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1}>
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span className="text-xs text-[#828282] px-1">
            {safeCurrentPage}/{totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages}>
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </div>

      {canAdd && (<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>Create a new customer record.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input value={formData.idNumber} onChange={(event) => setFormData((prev) => ({ ...prev, idNumber: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>)}

      {canEdit && (<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input value={formData.idNumber} onChange={(event) => setFormData((prev) => ({ ...prev, idNumber: event.target.value }))}/>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleEdit} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>)}

      {canDelete && (<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete customer?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The customer will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-[#e9423a] hover:bg-[#e9423a]/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>)}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Payment history and lifecycle overview.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (<div className="space-y-5 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Customer</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedCustomer.name}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Phone</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedCustomer.phone}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Email</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedCustomer.email}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Active SIMs</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{customerSims.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">Payment History</h4>
                {paymentTransactions.length === 0 ? (<p className="text-sm text-[#828282]">No payment transactions yet.</p>) : (<div className="space-y-2">
                    {paymentTransactions.map((transaction) => {
                const amount = getTransactionAmount(transaction);
                return (<div key={`pay-${transaction.id}`} className="flex items-center justify-between p-3 rounded-lg border border-[#f3f3f3]">
                          <div>
                            <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')}</p>
                            <p className="text-xs text-[#828282]">{new Date(transaction.date).toLocaleString()} • {transaction.status}</p>
                          </div>
                          <p className="text-sm font-semibold text-[#1f1f1f]">{amount === null ? 'N/A' : `$${amount.toFixed(2)}`}</p>
                        </div>);
            })}
                  </div>)}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">Lifecycle</h4>
                {timelineEntries.length === 0 ? (<p className="text-sm text-[#828282]">No lifecycle events.</p>) : (<div className="space-y-2">
                    {timelineEntries.map((entry) => (<div key={entry.id} className="flex items-start gap-3 p-2">
                        <Clock3 className="w-4 h-4 text-[#828282] mt-0.5"/>
                        <div>
                          <p className="text-sm text-[#1f1f1f] capitalize">{entry.label}</p>
                          <p className="text-xs text-[#828282]">{new Date(entry.date).toLocaleString()}</p>
                        </div>
                      </div>))}
                  </div>)}
              </div>
            </div>)}
        </DialogContent>
      </Dialog>
    </div>);
}


