import { useState } from 'react';
import { Edit2, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight, Phone, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/presentation/components/ui/alert-dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
export function MSISDNInventory({ msisdns, onAdd, onEdit, onDelete }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMSISDN, setSelectedMSISDN] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [msisdnToDelete, setMsisdnToDelete] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
    });
    // Stats
    const totalMSISDNs = msisdns.length;
    const availableMSISDNs = msisdns.filter(m => m.status === 'available').length;
    const assignedMSISDNs = msisdns.filter(m => m.status === 'assigned').length;
    const filteredMSISDNs = msisdns.filter(msisdn => {
        const matchesSearch = msisdn.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (msisdn.simIccid && msisdn.simIccid.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || msisdn.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const handleAdd = () => {
        onAdd(formData);
        setFormData({ number: '' });
        setIsAddModalOpen(false);
    };
    const handleEdit = () => {
        if (selectedMSISDN) {
            onEdit({ ...selectedMSISDN, ...formData });
            setIsEditModalOpen(false);
            setSelectedMSISDN(null);
        }
    };
    const openEditModal = (msisdn) => {
        setSelectedMSISDN(msisdn);
        setFormData({ number: msisdn.number });
        setIsEditModalOpen(true);
    };
    const handleView = (msisdn) => {
        setSelectedMSISDN(msisdn);
        setViewOpen(true);
    };
    const handleDelete = (id) => {
        setMsisdnToDelete(id);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = () => {
        if (msisdnToDelete) {
            onDelete(msisdnToDelete);
            setDeleteConfirmOpen(false);
            setMsisdnToDelete(null);
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
              <input type="text" placeholder="Search MSISDNs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4"/>
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('available')}>Available</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('assigned')}>Assigned</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            <Plus className="w-4 h-4 mr-2"/>
            Add MSISDN
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f3f3f3]">
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f]">Phone Number</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f]">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f]">Assigned SIM (ICCID)</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f]">Assigned Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-[#1f1f1f]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMSISDNs.map((msisdn) => (<tr key={msisdn.id} className="border-b border-[#f3f3f3] hover:bg-[#fafafa] transition-colors group">
                  <td className="px-4 py-3 text-sm text-[#1f1f1f] font-medium">{msisdn.number}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${msisdn.status === 'available'
                ? 'bg-[#3ebb7f]/10 text-[#3ebb7f]'
                : 'bg-[#f6a94c]/10 text-[#f6a94c]'}`}>
                      {msisdn.status === 'available' ? (<CheckCircle2 className="w-3 h-3 mr-1"/>) : (<XCircle className="w-3 h-3 mr-1"/>)}
                      {msisdn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[#828282]">
                    {msisdn.simIccid || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#828282]">
                    {msisdn.assignedAt ? msisdn.assignedAt.toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#f3f3f3]" onClick={() => handleView(msisdn)}>
                        <Phone className="w-4 h-4 text-[#828282]"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#f3f3f3]" onClick={() => openEditModal(msisdn)}>
                        <Edit2 className="w-4 h-4 text-[#828282]"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#f3f3f3]" onClick={() => handleDelete(msisdn.id)} disabled={msisdn.status === 'assigned'}>
                        <Trash2 className={`w-4 h-4 ${msisdn.status === 'assigned' ? 'text-[#c9c7c7]' : 'text-[#e9423a]'}`}/>
                      </Button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#f3f3f3] flex items-center justify-between">
          <p className="text-sm text-[#828282]">
            Showing {filteredMSISDNs.length} of {msisdns.length} MSISDNs
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
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New MSISDN</DialogTitle>
            <DialogDescription>Add a new phone number to the inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1-555-0000" value={formData.number} onChange={(e) => setFormData({ number: e.target.value })}/>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                Add MSISDN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit MSISDN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1-555-0000" value={formData.number} onChange={(e) => setFormData({ number: e.target.value })}/>
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
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>MSISDN Details</DialogTitle>
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
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
      </AlertDialog>
    </div>);
}

