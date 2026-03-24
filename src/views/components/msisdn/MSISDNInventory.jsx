import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight, Phone, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ENDPOINTS } from '@/services/endpoints';
import { apiRequestWithMeta } from '@/services/backendApi/client';
import { mapMsisdn } from '@/services/backendApi/mappers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEFAULT_COLUMN_ORDER = ['number', 'branch', 'price', 'status', 'sim', 'assignedDate', 'actions'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-msisdn-table-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_COLUMN_ORDER.length
  && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

const getBranchDisplayName = (msisdn) => msisdn.branchName || 'All Branches';

export function MSISDNInventory({ msisdns, onAdd, onBatchImport, onEdit, onDelete, useServerPagination = false }) {
    const canAdd = typeof onAdd === 'function';
    const canEdit = typeof onEdit === 'function';
    const canDelete = typeof onDelete === 'function';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMSISDN, setSelectedMSISDN] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [msisdnToDelete, setMsisdnToDelete] = useState(null);
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
    const [serverMsisdns, setServerMsisdns] = useState([]);
    const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const [branches, setBranches] = useState([]);
    useEffect(() => {
      try {
        window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      }
      catch {
        // ignore storage errors
      }
    }, [columnOrder]);

    const [formData, setFormData] = useState({
        number: '',
      price: 0,
      branchId: 'none',
    });
    const [addMode, setAddMode] = useState('single');
    const [batchFile, setBatchFile] = useState(null);
    const [batchStatus, setBatchStatus] = useState('available');
    const [batchPrice, setBatchPrice] = useState(0);
    const [batchBranchId, setBatchBranchId] = useState('none');
    const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
    // Stats
    const sourceMsisdns = useServerPagination ? serverMsisdns : msisdns;
    const totalMSISDNs = useServerPagination ? (serverPagination.totalRecords || sourceMsisdns.length) : sourceMsisdns.length;
    const availableMSISDNs = sourceMsisdns.filter(m => m.status === 'available').length;
    const assignedMSISDNs = sourceMsisdns.filter(m => m.status === 'assigned').length;
    const filteredMSISDNs = sourceMsisdns.filter(msisdn => {
        if (useServerPagination) {
            return true;
        }
        const matchesSearch = msisdn.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (msisdn.simIccid && msisdn.simIccid.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || msisdn.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const itemsPerPage = 10;
    const totalPages = useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredMSISDNs.length / itemsPerPage));
    const safeCurrentPage = useServerPagination
      ? Math.min(serverPagination.currentPage || currentPage, totalPages)
      : Math.min(currentPage, totalPages);
    const startIndex = useServerPagination
      ? (safeCurrentPage - 1) * (serverPagination.pageSize || itemsPerPage)
      : (safeCurrentPage - 1) * itemsPerPage;
    const paginatedMSISDNs = useServerPagination
      ? filteredMSISDNs
      : filteredMSISDNs.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
      const loadBranches = async () => {
        const response = await apiRequestWithMeta(`${ENDPOINTS.branches.list}?page=1&pageSize=200`);
        setBranches((response.data || []).map((branch) => ({ id: String(branch.id ?? branch.branch_id), name: branch.name })));
      };

      loadBranches();
    }, []);

    useEffect(() => {
      const loadServerMsisdns = async () => {
        if (!useServerPagination) {
          return;
        }
        try {
          setLoading(true);
          const params = new URLSearchParams({
            page: String(currentPage),
            pageSize: String(itemsPerPage),
          });
          if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
          }
          if (statusFilter !== 'all') {
            params.set('status', statusFilter);
          }
          const response = await apiRequestWithMeta(`${ENDPOINTS.numberPool.list}?${params.toString()}`);
          setServerMsisdns((response.data || []).map(mapMsisdn));
          setServerPagination(response.pagination || { currentPage, pageSize: itemsPerPage, totalPages: 1, totalRecords: 0 });
        } finally {
          setLoading(false);
        }
      };

      loadServerMsisdns();
    }, [currentPage, searchTerm, statusFilter, useServerPagination, refreshTick]);
    const handleAdd = async () => {
        if (!onAdd)
            return;
        const result = await onAdd(formData);
        if (result !== false) {
          setFormData({ number: '', price: 0, branchId: 'none' });
            setIsAddModalOpen(false);
            if (useServerPagination) {
              setRefreshTick((prev) => prev + 1);
            }
        }
    };
    const handleBatchImport = async () => {
      if (!onBatchImport || !batchFile) {
        return;
      }
      setIsBatchSubmitting(true);
      try {
        const result = await onBatchImport({
          file: batchFile,
          status: batchStatus,
          price: Number(batchPrice || 0),
          branchId: batchBranchId !== 'none' ? batchBranchId : null,
        });
        if (result !== false) {
          setBatchFile(null);
          setBatchStatus('available');
          setBatchPrice(0);
          setBatchBranchId('none');
          setAddMode('single');
          setIsAddModalOpen(false);
          if (useServerPagination) {
            setRefreshTick((prev) => prev + 1);
          }
        }
      }
      finally {
        setIsBatchSubmitting(false);
      }
    };
    const handleEdit = async () => {
        if (!onEdit)
            return;
        if (selectedMSISDN) {
            const result = await onEdit({ ...selectedMSISDN, ...formData });
            if (result !== false) {
                setIsEditModalOpen(false);
                setSelectedMSISDN(null);
                if (useServerPagination) {
                  setRefreshTick((prev) => prev + 1);
                }
            }
        }
    };
    const openEditModal = (msisdn) => {
        setSelectedMSISDN(msisdn);
      setFormData({ number: msisdn.number, price: Number(msisdn.price || 0), branchId: msisdn.branchId || 'none' });
        setIsEditModalOpen(true);
    };
    const handleView = (msisdn) => {
        setSelectedMSISDN(msisdn);
        setViewOpen(true);
    };
    const handleDelete = (id) => {
        if (!onDelete)
            return;
        setMsisdnToDelete(id);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = async () => {
        if (msisdnToDelete) {
            if (!onDelete)
                return;
            const result = await onDelete(msisdnToDelete);
            if (result !== false) {
                setDeleteConfirmOpen(false);
                setMsisdnToDelete(null);
                if (useServerPagination) {
                  setRefreshTick((prev) => prev + 1);
                }
            }
        }
    };
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
          number: {
            label: 'Phone Number',
            renderCell: (msisdn) => <td className="px-4 py-3 text-sm text-[#1f1f1f] font-medium transition-all duration-200">{msisdn.number}</td>
          },
          branch: {
            label: 'Branch',
            renderCell: (msisdn) => <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{getBranchDisplayName(msisdn)}</td>
          },
          price: {
            label: 'Price',
            renderCell: (msisdn) => <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">${Number(msisdn.price || 0).toFixed(2)}</td>
          },
          status: {
            label: 'Status',
            renderCell: (msisdn) => (<td className="px-4 py-3 transition-all duration-200">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${msisdn.status === 'available'
              ? 'bg-[#3ebb7f]/10 text-[#3ebb7f]'
              : 'bg-[#f6a94c]/10 text-[#f6a94c]'}`}>
                {msisdn.status === 'available' ? (<CheckCircle2 className="w-3 h-3 mr-1"/>) : (<XCircle className="w-3 h-3 mr-1"/>)}
                {msisdn.status}
                </span>
              </td>)
          },
          sim: {
            label: 'Assigned SIM (ICCID)',
            renderCell: (msisdn) => <td className="px-4 py-3 text-sm font-mono text-[#828282] transition-all duration-200">{msisdn.simIccid || '—'}</td>
          },
          assignedDate: {
            label: 'Assigned Date',
            renderCell: (msisdn) => <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{msisdn.assignedAt ? msisdn.assignedAt.toLocaleDateString() : '—'}</td>
          },
          actions: {
            label: 'Actions',
            renderCell: (msisdn) => (<td className="px-4 py-3 transition-all duration-200">
                <div className="flex items-center gap-1">
                {canEdit && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#f3f3f3]" onClick={(event) => {
                  event.stopPropagation();
                  openEditModal(msisdn);
                }}>
                  <Edit2 className="w-4 h-4 text-[#828282]"/>
                  </Button>)}
                {canDelete && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#f3f3f3]" onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(msisdn.id);
                }} disabled={msisdn.status === 'assigned'}>
                  <Trash2 className={`w-4 h-4 ${msisdn.status === 'assigned' ? 'text-[#c9c7c7]' : 'text-[#e9423a]'}`}/>
                  </Button>)}
                </div>
              </td>)
          }
        };
    return (<div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] border-l-4 border-l-[#5b93ff] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#828282]">Total MSISDNs</p>
              <p className="text-2xl font-semibold text-[#1f1f1f]">{totalMSISDNs}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#5b93ff]/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#5b93ff]"/>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] border-l-4 border-l-[#3ebb7f] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#828282]">Available</p>
              <p className="text-2xl font-semibold text-[#1f1f1f]">{availableMSISDNs}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#3ebb7f]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#3ebb7f]"/>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#f3f3f3] border-l-4 border-l-[#f6a94c] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#828282]">Assigned</p>
              <p className="text-2xl font-semibold text-[#1f1f1f]">{assignedMSISDNs}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#f6a94c]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#f6a94c]"/>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
              <input type="text" placeholder="Search MSISDNs..." value={searchTerm} onChange={(e) => {
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
              setStatusFilter('available');
              setCurrentPage(1);
          }}>Available</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
              setStatusFilter('assigned');
              setCurrentPage(1);
          }}>Assigned</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canAdd && (<Button onClick={() => {
            setAddMode('single');
            setBatchFile(null);
            setBatchStatus('available');
            setBatchPrice(0);
            setIsAddModalOpen(true);
          }} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
              <Plus className="w-4 h-4 mr-2"/>
              Add MSISDN
            </Button>)}
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
                {paginatedMSISDNs.map((msisdn) => (<tr key={msisdn.id} onClick={() => handleView(msisdn)} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors group cursor-pointer">
                  {columnOrder.map((columnId) => {
                    const cell = columns[columnId].renderCell(msisdn);
                    if (!isValidElement(cell)) {
                      return null;
                    }
                    return cloneElement(cell, { key: `${msisdn.id}-${columnId}` });
                  })}
                </tr>))}
            </tbody>
          </table>
          {loading && (<div className="p-4 text-sm text-[#828282]">Loading MSISDNs...</div>)}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
          <p className="text-sm text-[#828282]">
            Showing {filteredMSISDNs.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedMSISDNs.length, filteredMSISDNs.length)} of {filteredMSISDNs.length} MSISDNs
          </p>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Add Modal */}
      {canAdd && (<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New MSISDN</DialogTitle>
            <DialogDescription>Add a new phone number to the inventory.</DialogDescription>
          </DialogHeader>
          <Tabs value={addMode} onValueChange={setAddMode} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="batch">Excel Batch</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+1-555-0000" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })}/>
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}/>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branchId} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Branches</SelectItem>
                    {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                  Add MSISDN
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Excel File (.xlsx)</Label>
                <Input type="file" accept=".xlsx" onChange={(e) => setBatchFile(e.target.files?.[0] || null)}/>
              </div>

              <div className="space-y-2">
                <Label>Default Status</Label>
                <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} className="w-full rounded-md border border-[#c9c7c7] bg-white px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:border-[#1f1f1f]">
                  <option value="available">available</option>
                  <option value="assigned">assigned</option>
                  <option value="reserved">reserved</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Default Price</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={batchPrice} onChange={(e) => setBatchPrice(e.target.value)}/>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={batchBranchId} onValueChange={setBatchBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Branches</SelectItem>
                    {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-[#f3f3f3] p-3">
                <p className="text-sm font-medium text-[#1f1f1f] mb-2">Excel format sample</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-[#f3f3f3]">
                    <thead>
                      <tr className="bg-[#f9f9f9]">
                        <th className="px-3 py-2 text-left border-b border-[#f3f3f3]">msisdn</th>
                        <th className="px-3 py-2 text-left border-b border-[#f3f3f3]">price (optional)</th>
                        <th className="px-3 py-2 text-left border-b border-[#f3f3f3]">status (optional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 border-b border-[#f3f3f3]">+855012345678</td>
                        <td className="px-3 py-2 border-b border-[#f3f3f3]">5</td>
                        <td className="px-3 py-2 border-b border-[#f3f3f3]">available</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">+855098765432</td>
                        <td className="px-3 py-2">10</td>
                        <td className="px-3 py-2">reserved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBatchImport} disabled={!batchFile || isBatchSubmitting} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                  {isBatchSubmitting ? 'Importing...' : 'Import Batch'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>)}

      {/* Edit Modal */}
      {canEdit && (<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit MSISDN</DialogTitle>
            <DialogDescription>Update the selected phone number details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1-555-0000" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formData.branchId} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Branches</SelectItem>
                  {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>)}

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>MSISDN Details</DialogTitle>
            <DialogDescription>View full details for this MSISDN record.</DialogDescription>
          </DialogHeader>
          {selectedMSISDN && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#828282]">Phone Number</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedMSISDN.number}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${selectedMSISDN.status === 'available'
                ? 'bg-[#3ebb7f]/10 text-[#3ebb7f]'
                : 'bg-[#f6a94c]/10 text-[#f6a94c]'}`}>
                    {selectedMSISDN.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Price</p>
                  <p className="text-sm text-[#1f1f1f]">${Number(selectedMSISDN.price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Branch</p>
                  <p className="text-sm text-[#1f1f1f]">{getBranchDisplayName(selectedMSISDN)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Assigned SIM</p>
                  <p className="text-sm font-mono text-[#1f1f1f]">{selectedMSISDN.simIccid || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Assigned Date</p>
                  <p className="text-sm text-[#1f1f1f]">
                    {selectedMSISDN.assignedAt ? selectedMSISDN.assignedAt.toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#828282]">Created</p>
                  <p className="text-sm text-[#1f1f1f]">{selectedMSISDN.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {canDelete && (<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the MSISDN from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#e9423a] hover:bg-[#e9423a]/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>)}
    </div>);
}
