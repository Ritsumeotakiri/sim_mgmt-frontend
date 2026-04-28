import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, MoreHorizontal, Mail, Calendar } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/presentation/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/presentation/components/ui/alert-dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/presentation/components/ui/select';
const roles = ['admin', 'manager', 'operator', 'viewer'];
export function UserManagement({ users, onAdd, onEdit, onDelete }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'viewer',
    });
    const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleAdd = () => {
        onAdd(formData);
        setFormData({ name: '', email: '', role: 'viewer' });
        setIsAddModalOpen(false);
    };
    const handleEdit = () => {
        if (selectedUser) {
            onEdit({ ...selectedUser, ...formData });
            setIsEditModalOpen(false);
            setSelectedUser(null);
        }
    };
    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setIsEditModalOpen(true);
    };
    const handleDelete = (id) => {
        setUserToDelete(id);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = () => {
        if (userToDelete) {
            onDelete(userToDelete);
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
          <Plus className="w-4 h-4 mr-2"/>
          Add User
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (<div key={user.id} className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div>
                  <h3 className="font-medium text-[#1f1f1f]">{user.name}</h3>
                  <RoleBadge role={user.role}/>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4 text-[#828282]"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditModal(user)}>
                    <Edit2 className="w-4 h-4 mr-2"/>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-[#e9423a]">
                    <Trash2 className="w-4 h-4 mr-2"/>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#828282]">
                <Mail className="w-4 h-4"/>
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#828282]">
                <Calendar className="w-4 h-4"/>
                Joined {user.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>))}
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Enter user name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role"/>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (<SelectItem key={role} value={role}>
                      <span className="capitalize">{role}</span>
                    </SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Enter user name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role"/>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (<SelectItem key={role} value={role}>
                      <span className="capitalize">{role}</span>
                    </SelectItem>))}
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
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user from the system.
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

