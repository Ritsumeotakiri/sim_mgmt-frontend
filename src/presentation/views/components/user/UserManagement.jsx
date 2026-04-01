import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Edit2, Trash2, MoreHorizontal, Mail, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '@/presentation/components/ui/button';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapUser } from '@/data/services/backendApi/mappers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/presentation/components/ui/alert-dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/presentation/components/ui/select';
const roles = ['admin', 'manager', 'operator', 'viewer'];
const avatarOptions = [
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=classic-woman', label: 'Classic Woman' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=classic-man', label: 'Classic Man' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=office-smile', label: 'Office Smile' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=friendly-staff', label: 'Friendly Staff' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frontdesk-pro', label: 'Frontdesk Pro' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team-lead', label: 'Team Lead' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=support-agent', label: 'Support Agent' },
  { value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=field-operator', label: 'Field Operator' },
];

function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {avatarOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full p-0.5 border transition-all ${selected ? 'border-[#1f1f1f] ring-1 ring-[#1f1f1f]' : 'border-[#e6e6e6] hover:border-[#bdbdbd]'}`}
            aria-label={option.label}
            title={option.label}
          >
            <img src={option.value} alt={option.label} className="w-10 h-10 rounded-full bg-[#f3f3f3]"/>
          </button>
        );
      })}
    </div>
  );
}

export function UserManagement({ users, transactions = [], onAdd, onEdit, onDelete, useServerPagination = false }) {
    const canAdd = typeof onAdd === 'function';
    const canEdit = typeof onEdit === 'function';
    const canDelete = typeof onDelete === 'function';
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [selectedProfileUser, setSelectedProfileUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [serverUsers, setServerUsers] = useState([]);
    const [serverPagination, setServerPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalRecords: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const usersRequestRef = useRef(0);
    const branchesRequestRef = useRef(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
      branchId: 'none',
      avatar: avatarOptions[0].value,
    });
    const sourceUsers = useServerPagination ? serverUsers : users;

    const performanceByUserName = useMemo(() => {
      return sourceUsers.reduce((acc, user) => {
        const userTransactions = transactions.filter((transaction) => transaction.userName === user.name);
        const completedTransactions = userTransactions.filter((transaction) => transaction.status === 'completed').length;
        const pendingTransactions = userTransactions.filter((transaction) => transaction.status === 'pending').length;
        const failedTransactions = userTransactions.filter((transaction) => transaction.status === 'failed').length;
        const salesCount = userTransactions.filter((transaction) => transaction.type === 'sale').length;
        const lastActivity = userTransactions.length > 0
          ? [...userTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())[0].date
          : null;
        acc[user.name] = {
          totalTransactions: userTransactions.length,
          completedTransactions,
          pendingTransactions,
          failedTransactions,
          salesCount,
          lastActivity,
        };
        return acc;
      }, {});
    }, [sourceUsers, transactions]);

    const filteredUsers = sourceUsers.filter(user => {
        if (useServerPagination) {
            return true;
        }
        return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.branchName || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const itemsPerPage = 10;
    const totalPages = useServerPagination
      ? Math.max(serverPagination.totalPages || 1, 1)
      : Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const safeCurrentPage = useServerPagination
      ? Math.min(serverPagination.currentPage || currentPage, totalPages)
      : Math.min(currentPage, totalPages);
    const startIndex = useServerPagination
      ? (safeCurrentPage - 1) * (serverPagination.pageSize || itemsPerPage)
      : (safeCurrentPage - 1) * itemsPerPage;
    const paginatedUsers = useServerPagination
      ? filteredUsers
      : filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const groupedUsersByBranch = useMemo(() => {
      const groupsMap = new Map();

      paginatedUsers.forEach((user) => {
        const branchLabel = user.branchName || (user.branchId ? `Branch ${user.branchId}` : 'No Branch Assigned');
        if (!groupsMap.has(branchLabel)) {
          groupsMap.set(branchLabel, {
            branchLabel,
            managers: [],
            operators: [],
            others: [],
          });
        }

        const branchGroup = groupsMap.get(branchLabel);
        if (user.role === 'manager') {
          branchGroup.managers.push(user);
        }
        else if (user.role === 'operator') {
          branchGroup.operators.push(user);
        }
        else {
          branchGroup.others.push(user);
        }
      });

      return Array.from(groupsMap.values()).sort((a, b) => {
        const aIsUnassigned = a.branchLabel === 'No Branch Assigned';
        const bIsUnassigned = b.branchLabel === 'No Branch Assigned';
        if (aIsUnassigned && !bIsUnassigned)
          return 1;
        if (!aIsUnassigned && bIsUnassigned)
          return -1;
        return a.branchLabel.localeCompare(b.branchLabel);
      });
    }, [paginatedUsers]);

    const renderUserCard = (user) => (
      <div key={user.id} role="button" tabIndex={0} onClick={() => setSelectedProfileUser(user)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedProfileUser(user);
            }
        }} className="w-full text-left bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-[#f3f3f3]"/>
            <div>
              <h3 className="font-medium text-[#1f1f1f]">{user.name}</h3>
              <RoleBadge role={user.role}/>
            </div>
          </div>
          {(canEdit || canDelete) && (<div onClick={(event) => event.stopPropagation()}>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4 text-[#828282]"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (<DropdownMenuItem onClick={() => openEditModal(user)}>
                    <Edit2 className="w-4 h-4 mr-2"/>
                    Edit
                  </DropdownMenuItem>)}
                {canDelete && (<DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-[#e9423a]">
                    <Trash2 className="w-4 h-4 mr-2"/>
                    Delete
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>)}
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
      </div>
    );

    useEffect(() => {
      const loadServerUsers = async () => {
        if (!useServerPagination) {
          return;
        }

        const requestId = ++usersRequestRef.current;
        try {
          setLoading(true);
          const params = new URLSearchParams({
            page: String(currentPage),
            pageSize: String(itemsPerPage),
          });
          if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
          }
          const response = await apiRequestWithMeta(`${ENDPOINTS.users.list}?${params.toString()}`);
          if (requestId !== usersRequestRef.current) {
            return;
          }

          const pagination = response.pagination || { currentPage, pageSize: itemsPerPage, totalPages: 1, totalRecords: 0 };
          setServerUsers((response.data || []).map(mapUser));
          setServerPagination(pagination);
          if (pagination.currentPage && pagination.currentPage !== currentPage) {
            setCurrentPage(pagination.currentPage);
          }
        }
        finally {
          if (requestId === usersRequestRef.current) {
            setLoading(false);
          }
        }
      };

      loadServerUsers();
    }, [currentPage, searchTerm, refreshTick, useServerPagination]);

    useEffect(() => {
      let isActive = true;

      const loadBranches = async () => {
        const requestId = ++branchesRequestRef.current;

        try {
          setBranchesLoading(true);
          const items = [];
          let page = 1;
          let hasNext = true;

          while (hasNext) {
            const response = await apiRequestWithMeta(`${ENDPOINTS.branches.list}?page=${page}&pageSize=100`);
            if (!isActive || requestId !== branchesRequestRef.current) {
              return;
            }

            items.push(...(response.data || []).map((branch) => ({
              id: String(branch.id ?? branch.branch_id),
              name: branch.name,
            })));

            hasNext = Boolean(response.pagination?.hasNext);
            page += 1;
          }

          if (isActive && requestId === branchesRequestRef.current) {
            setBranches(items);
          }
        }
        finally {
          if (isActive && requestId === branchesRequestRef.current) {
            setBranchesLoading(false);
          }
        }
      };

      loadBranches();

      return () => {
        isActive = false;
      };
    }, []);
    const handleAdd = async () => {
        if (!onAdd)
            return;
        const result = await onAdd(formData);
        if (result !== false) {
            setFormData({ name: '', email: '', password: '', role: 'viewer', branchId: 'none', avatar: avatarOptions[0].value });
            setIsAddModalOpen(false);
          if (useServerPagination) {
            setRefreshTick((prev) => prev + 1);
          }
        }
    };
    const handleEdit = async () => {
        if (!onEdit)
            return;
        if (selectedUser) {
            const result = await onEdit({ ...selectedUser, ...formData });
            if (result !== false) {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              if (useServerPagination) {
                setRefreshTick((prev) => prev + 1);
              }
            }
        }
    };
    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
          branchId: user.branchId || 'none',
          avatar: user.avatar || avatarOptions[0].value,
        });
        setIsEditModalOpen(true);
    };
    const handleDelete = (id) => {
        if (!onDelete)
            return;
        setUserToDelete(id);
        setDeleteConfirmOpen(true);
    };
    const confirmDelete = async () => {
        if (userToDelete) {
            if (!onDelete)
                return;
            const result = await onDelete(userToDelete);
            if (result !== false) {
                setDeleteConfirmOpen(false);
                setUserToDelete(null);
              if (useServerPagination) {
                setRefreshTick((prev) => prev + 1);
              }
            }
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} className="w-64 pl-10 pr-4 py-2 border border-[#c9c7c7] rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:border-[#1f1f1f] transition-colors"/>
        </div>
        {canAdd && (<Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            <Plus className="w-4 h-4 mr-2"/>
            Add User
          </Button>)}
      </div>

      {/* Users Grouped by Branch */}
      <div className="space-y-5">
        {groupedUsersByBranch.map((branchGroup) => (
          <div key={branchGroup.branchLabel} className="border border-[#f3f3f3] bg-white rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1f1f1f]">{branchGroup.branchLabel}</h3>
              <span className="text-xs text-[#828282]">
                {branchGroup.managers.length + branchGroup.operators.length + branchGroup.others.length} users
              </span>
            </div>

            {branchGroup.managers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#828282]">Managers</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchGroup.managers.map(renderUserCard)}
                </div>
              </div>
            )}

            {branchGroup.operators.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#828282]">Operators</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchGroup.operators.map(renderUserCard)}
                </div>
              </div>
            )}

            {branchGroup.others.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[#828282]">Other Roles</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchGroup.others.map(renderUserCard)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (<div className="text-sm text-[#828282]">Loading users...</div>)}

      <div className="p-4 border border-[#f3f3f3] rounded-xl bg-white flex items-center justify-between">
        <p className="text-sm text-[#828282]">
          Showing {filteredUsers.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + paginatedUsers.length, useServerPagination ? (serverPagination.totalRecords || filteredUsers.length) : filteredUsers.length)} of {useServerPagination ? (serverPagination.totalRecords || filteredUsers.length) : filteredUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1}>
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span className="text-xs text-[#828282] px-1">{safeCurrentPage}/{totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages}>
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedProfileUser)} onOpenChange={(isOpen) => {
            if (!isOpen)
                setSelectedProfileUser(null);
        }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Info & Performance</DialogTitle>
            <DialogDescription>View user profile details and activity summary.</DialogDescription>
          </DialogHeader>
          {selectedProfileUser && (<div className="space-y-5">
              <div className="flex items-center gap-3">
                <img src={selectedProfileUser.avatar} alt={selectedProfileUser.name} className="w-14 h-14 rounded-full bg-[#f3f3f3]"/>
                <div>
                  <h4 className="font-semibold text-[#1f1f1f]">{selectedProfileUser.name}</h4>
                  <p className="text-sm text-[#828282]">{selectedProfileUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Role</p>
                  <p className="text-sm font-medium text-[#1f1f1f] capitalize">{selectedProfileUser.role}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Joined</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedProfileUser.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Session Status</p>
                  <p className={`text-sm font-medium ${selectedProfileUser.sessionActive ? 'text-[#3ebb7f]' : 'text-[#828282]'}`}>
                    {selectedProfileUser.sessionActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Session Expires</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">
                    {selectedProfileUser.sessionExpiresAt
                      ? selectedProfileUser.sessionExpiresAt.toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Last Login</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">
                    {selectedProfileUser.lastLoginAt
                      ? selectedProfileUser.lastLoginAt.toLocaleString()
                      : 'Never'}
                  </p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Last Logout</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">
                    {selectedProfileUser.lastLogoutAt
                      ? selectedProfileUser.lastLogoutAt.toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedProfileUser.lastSessionIp && (
                <div className="bg-white border border-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Last Session IP</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedProfileUser.lastSessionIp}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Sales</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{performanceByUserName[selectedProfileUser.name]?.salesCount || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Total Transactions</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{performanceByUserName[selectedProfileUser.name]?.totalTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Completed</p>
                  <p className="text-base font-semibold text-[#3ebb7f]">{performanceByUserName[selectedProfileUser.name]?.completedTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Pending/Failed</p>
                  <p className="text-base font-semibold text-[#f6a94c]">{(performanceByUserName[selectedProfileUser.name]?.pendingTransactions || 0) +
                    (performanceByUserName[selectedProfileUser.name]?.failedTransactions || 0)}</p>
                </div>
              </div>

              <div className="bg-white border border-[#f3f3f3] rounded-lg p-3">
                <p className="text-xs text-[#828282]">Last Activity</p>
                <p className="text-sm font-medium text-[#1f1f1f]">{performanceByUserName[selectedProfileUser.name]?.lastActivity
                    ? performanceByUserName[selectedProfileUser.name].lastActivity.toLocaleString()
                    : 'No activity yet'}</p>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      {canAdd && (<Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter the user information and choose a role to create the account.</DialogDescription>
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
              <Label>Password</Label>
              <Input type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branchId || 'none'} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No branch</SelectItem>
                    {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                {branchesLoading && (<p className="text-xs text-[#828282]">Loading branches...</p>)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <AvatarPicker value={formData.avatar} onChange={(value) => setFormData({ ...formData, avatar: value })}/>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={formData.password.trim().length < 6} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                Add User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>)}

      {/* Edit User Modal */}
      {canEdit && (<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the selected user&apos;s profile details and assigned role.</DialogDescription>
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
              <Label>Password</Label>
              <Input type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branchId || 'none'} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No branch</SelectItem>
                    {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                {branchesLoading && (<p className="text-xs text-[#828282]">Loading branches...</p>)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <AvatarPicker value={formData.avatar} onChange={(value) => setFormData({ ...formData, avatar: value })}/>
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

      {/* Delete Confirmation */}
      {canDelete && (<AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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
      </AlertDialog>)}
    </div>);
}


