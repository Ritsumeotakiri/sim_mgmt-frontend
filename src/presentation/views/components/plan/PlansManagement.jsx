import { cloneElement, isValidElement, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/presentation/components/ui/alert-dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';

const DEFAULT_COLUMN_ORDER = ['name', 'price', 'data', 'duration', 'actions'];
const COLUMN_ORDER_STORAGE_KEY = 'column-order-plans-table-v1';

const isValidColumnOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_COLUMN_ORDER.length
  && DEFAULT_COLUMN_ORDER.every((columnId) => value.includes(columnId));

export function PlansManagement({ plans, canEdit = false, onAdd, onEdit, onDelete }) {
  const normalizeDataLimit = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
      return 'unlimited';
    }
    if (/^unlimited$/i.test(raw)) {
      return 'unlimited';
    }
    if (/^\d+(\.\d+)?$/.test(raw)) {
      return `${raw}GB`;
    }
    const withUnitMatch = raw.match(/^(\d+(?:\.\d+)?)\s?(MB|GB|TB)$/i);
    if (withUnitMatch) {
      return `${withUnitMatch[1]}${withUnitMatch[2].toUpperCase()}`;
    }
    return raw;
  };

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', durationDays: '', dataLimit: 'unlimited' });
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
    useEffect(() => {
      try {
        window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
      }
      catch {
        // ignore storage errors
      }
    }, [columnOrder]);

    const filteredPlans = useMemo(() => {
        const keyword = searchTerm.toLowerCase();
        return plans.filter((plan) => plan.name.toLowerCase().includes(keyword));
    }, [plans, searchTerm]);
    const openEditModal = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            name: plan.name,
            price: String(plan.price),
          durationDays: String(plan.durationDays || 30),
          dataLimit: String(plan.dataLimit || 'unlimited'),
        });
        setIsEditModalOpen(true);
    };
    const submitAdd = async () => {
        if (!onAdd)
            return;
        const result = await onAdd({
            name: formData.name,
            price: Number(formData.price),
            durationDays: Number(formData.durationDays),
            dataLimit: normalizeDataLimit(formData.dataLimit),
        });
        if (result !== false) {
            setIsAddModalOpen(false);
          setFormData({ name: '', price: '', durationDays: '', dataLimit: 'unlimited' });
        }
    };
    const submitEdit = async () => {
        if (!onEdit || !selectedPlan)
            return;
        const result = await onEdit(selectedPlan.id, {
            name: formData.name,
            price: Number(formData.price),
            durationDays: Number(formData.durationDays),
            dataLimit: normalizeDataLimit(formData.dataLimit),
        });
        if (result !== false) {
            setIsEditModalOpen(false);
            setSelectedPlan(null);
        }
    };
    const confirmDelete = async () => {
        if (!onDelete || !planToDelete)
            return;
        const result = await onDelete(planToDelete);
        if (result !== false) {
            setDeleteConfirmOpen(false);
            setPlanToDelete(null);
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
          name: {
            label: 'Plan Name',
            renderCell: (plan) => <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">{plan.name}</td>
          },
          price: {
            label: 'Price',
            renderCell: (plan) => <td className="px-4 py-3 text-sm text-[#1f1f1f] transition-all duration-200">${plan.price.toFixed(2)}</td>
          },
          data: {
            label: 'Data',
            renderCell: (plan) => <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{plan.dataLimit}</td>
          },
          duration: {
            label: 'Duration',
            renderCell: (plan) => <td className="px-4 py-3 text-sm text-[#828282] transition-all duration-200">{plan.durationDays} days</td>
          },
          actions: {
            label: 'Actions',
            renderCell: (plan) => (<td className="px-4 py-3 transition-all duration-200">
                {canEdit ? (<div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(plan)}>
                  <Edit2 className="w-4 h-4 text-[#828282]"/>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                setPlanToDelete(plan.id);
                setDeleteConfirmOpen(true);
              }}>
                  <Trash2 className="w-4 h-4 text-[#e9423a]"/>
                  </Button>
                </div>) : (<span className="text-xs text-[#828282]">Read only</span>)}
              </td>)
          }
        };
    return (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
      <div className="p-4 border-b border-[#f3f3f3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
          <input type="text" placeholder="Search plans..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
        </div>

        {canEdit && (<Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            <Plus className="w-4 h-4 mr-2"/>
            Add Plan
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
            {filteredPlans.map((plan) => (<tr key={plan.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa]">
                {columnOrder.map((columnId) => {
                  const cell = columns[columnId].renderCell(plan);
                  if (!isValidElement(cell)) {
                    return null;
                  }
                  return cloneElement(cell, { key: `${plan.id}-${columnId}` });
                })}
              </tr>))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#f3f3f3]">
        <p className="text-sm text-[#828282]">Showing {filteredPlans.length} of {plans.length} plans</p>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Plan</DialogTitle>
            <DialogDescription>Create a new plan with price, duration, and data allowance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input type="number" min="0.000694444" step="0.0000001" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}/>
              <p className="text-xs text-[#828282]">Tip: 1 minute = 0.000694444 days.</p>
            </div>
            <div className="space-y-2">
              <Label>Data Allowance</Label>
              <Input placeholder="10GB or unlimited" value={formData.dataLimit} onChange={(e) => setFormData({ ...formData, dataLimit: e.target.value })}/>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={submitAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details including data allowance and validity duration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Input type="number" min="0.000694444" step="0.0000001" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}/>
              <p className="text-xs text-[#828282]">Tip: 1 minute = 0.000694444 days.</p>
            </div>
            <div className="space-y-2">
              <Label>Data Allowance</Label>
              <Input placeholder="10GB or unlimited" value={formData.dataLimit} onChange={(e) => setFormData({ ...formData, dataLimit: e.target.value })}/>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={submitEdit} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan from the system.
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
    </div>);
}

