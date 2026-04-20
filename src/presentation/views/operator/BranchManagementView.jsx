import React, { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {Chart as ChartJS,CategoryScale,LinearScale, BarElement, Title, Tooltip, Legend,} from "chart.js";
import { Users, Plus, ChevronDown } from "lucide-react";
import {AlertDialog,AlertDialogTrigger, AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogFooter,AlertDialogCancel,} from "@/presentation/components/ui/alert-dialog";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,} from "@/presentation/components/ui/dialog";
import { getBranchManagementViewModel } from "@/domain/branch/getBranchManagementViewModel";
import { createBranch } from "@/data/services/backendApi/branch";
import { createUser, updateUser, deleteUser } from "@/data/services/backendApi/user";

ChartJS.register(  CategoryScale,  LinearScale,BarElement,Title,Tooltip,Legend,);
const BRANCH_SELECTION_KEY = "sim-mgmt-selected-branch-ids";
export default function BranchManagementView() {
    // All hooks at the top – no conditional calls
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedBranchIds, setSelectedBranchIdsState] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [newBranch, setNewBranch] = useState({ name: "", location: "" });
    const [addingBranch, setAddingBranch] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // User modal state
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userModalData, setUserModalData] = useState(null);

    // Add User modal state
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        branchId: 'none',
    });
    // Edit user modal state
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        role: 'operator',
        branchId: 'none',
    });

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);

    // Persistent selection setter
    const setSelectedBranchIds = (valueOrUpdater) => {
        setSelectedBranchIdsState((prev) => {
            const next =
                typeof valueOrUpdater === "function"
                    ? valueOrUpdater(prev)
                    : valueOrUpdater;
            try {
                localStorage.setItem(BRANCH_SELECTION_KEY, JSON.stringify(next));
            } catch (e) {
                console.error("Failed to save branch selection:", e);
            }
            return next;
        });
    };

    // Handler to open user modal
    const openUserModal = (user) => {
        setUserModalData(user);
        setUserModalOpen(true);
    };

    // Edit user — open modal with user data
    const handleEditClick = (user) => {
        setEditFormData({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'operator',
            branchId: user.branchId ? String(user.branchId) : 'none',
        });
        setIsEditUserOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            const payload = {
                id: editFormData.id,
                name: editFormData.name,
                password: editFormData.password || undefined,
                role: editFormData.role,
                branchId: editFormData.branchId,
            };
            await updateUser(payload);
            const data = await getBranchManagementViewModel();
            setBranches(data);
            setIsEditUserOpen(false);
            alert('User updated');
        } catch (err) {
            console.error('Failed to update user', err);
            alert('Failed to update user');
        }
    };

    // Delete user — open confirmation dialog
    const handleDeleteClick = (userId) => {
        setDeletingUserId(userId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (!deletingUserId) return;
            await deleteUser(deletingUserId);
            const data = await getBranchManagementViewModel();
            setBranches(data);
            setDeleteDialogOpen(false);
            setDeletingUserId(null);
            alert('User deleted');
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user');
        }
    };

    // Load branches and restore selection
    useEffect(() => {
        const loadBranches = async () => {
            try {
                setLoading(true);
                const data = await getBranchManagementViewModel();
                setBranches(data);

                // Restore selection from localStorage
                let restoredIds = [];
                try {
                    const stored = localStorage.getItem(BRANCH_SELECTION_KEY);
                    if (stored) restoredIds = JSON.parse(stored);
                } catch (e) {
                    console.error("Failed to parse stored branch selection:", e);
                }

                const validIds = restoredIds.filter((id) =>
                    data.some((b) => b.id === id),
                );
                if (validIds.length > 0) {
                    setSelectedBranchIds(validIds);
                    setActiveTabId(validIds[0]);
                } else if (data.length > 0) {
                    setSelectedBranchIds([data[0].id]);
                    setActiveTabId(data[0].id);
                } else {
                    setActiveTabId(null);
                }
            } catch (err) {
                setError("Failed to load branches.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadBranches();
    }, []);

    // Sync activeTabId when selectedBranchIds change
    useEffect(() => {
        if (selectedBranchIds.length === 0) {
            setActiveTabId(null);
        } else if (!selectedBranchIds.includes(activeTabId)) {
            setActiveTabId(selectedBranchIds[0]);
        }
    }, [selectedBranchIds, activeTabId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddBranch = async (e) => {
        e.preventDefault();
        if (!newBranch.name.trim()) return;
        setAddingBranch(true);
        try {
            await createBranch({
                name: newBranch.name.trim(),
                location: newBranch.location?.trim() || "",
            });
            setNewBranch({ name: "", location: "" });
            setDialogOpen(false);

            // Refresh branch list
            const data = await getBranchManagementViewModel();
            setBranches(data);

            // Update selection: keep existing valid IDs, or fallback to first branch
            setSelectedBranchIds((prevIds) => {
                const validIds = prevIds.filter((id) => data.some((b) => b.id === id));
                if (validIds.length > 0) {
                    setActiveTabId(validIds[0]);
                    return validIds;
                } else if (data.length > 0) {
                    setActiveTabId(data[0].id);
                    return [data[0].id];
                } else {
                    setActiveTabId(null);
                    return [];
                }
            });

            alert("Branch added successfully!");
        } catch (error) {
            console.error("Error adding branch:", error);
            alert("Failed to add branch. Please try again.");
        } finally {
            setAddingBranch(false);
        }
    };

    const handleSelectAll = () => {
        const allIds = branches.map((b) => b.id);
        setSelectedBranchIds(allIds);
    };

    const handleClearAll = () => {
        setSelectedBranchIds([]);
    };

    const filteredBranches = branches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
    );

    const activeBranch = branches.find((b) => b.id === activeTabId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-500">Loading branches...</div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-red-500">{error}</div>
            </div>
        );
    }
    return (
        <>
            <div className="w-full h-full min-h-screen bg-gray-50 p-6">
                <div className="w-full space-y-6">
                    {/* Header removed — buttons moved into filter bar for right alignment */}

                    {/* Filter Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors min-w-[220px] justify-between"
                            >
                                <span className="text-sm font-medium text-gray-700">
                                    {selectedBranchIds.length > 0
                                        ? `${selectedBranchIds.length} branch${selectedBranchIds.length > 1 ? "es" : ""} selected`
                                        : "Select branches"}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute z-20 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <div className="p-3 border-b border-gray-200">
                                        <Input
                                            placeholder="Search branches..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-1">
                                        {filteredBranches.length === 0 ? (
                                            <div className="text-sm text-gray-500 px-3 py-2">
                                                No branches found
                                            </div>
                                        ) : (
                                            filteredBranches.map((branch) => (
                                                <label
                                                    key={branch.id}
                                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBranchIds.includes(branch.id)}
                                                        onChange={() => {
                                                            setSelectedBranchIds((prev) =>
                                                                prev.includes(branch.id)
                                                                    ? prev.filter((id) => id !== branch.id)
                                                                    : [...prev, branch.id],
                                                            );
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        {branch.name}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button onClick={() => setIsAddUserOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4" />
                                Add User
                            </Button>

                            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button className="gap-2 bg-gray-800 hover:bg-gray-900 text-white">
                                        <Plus className="w-4 h-4" />
                                        Add Branch
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="sm:max-w-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Add New Branch</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <form onSubmit={handleAddBranch} className="space-y-4 mt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Branch Name
                                            </label>
                                            <Input
                                                value={newBranch.name}
                                                onChange={(e) =>
                                                    setNewBranch({ ...newBranch, name: e.target.value })
                                                }
                                                placeholder="e.g., Downtown Branch"
                                                disabled={addingBranch}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Location <span className="text-gray-400">(optional)</span>
                                            </label>
                                            <Input
                                                value={newBranch.location}
                                                onChange={(e) =>
                                                    setNewBranch({ ...newBranch, location: e.target.value })
                                                }
                                                placeholder="e.g., 123 Main St"
                                                disabled={addingBranch}
                                            />
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel type="button" disabled={addingBranch}>
                                                Cancel
                                            </AlertDialogCancel>
                                            <Button
                                                type="submit"
                                                disabled={addingBranch || !newBranch.name.trim()}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {addingBranch ? "Saving..." : "Save Branch"}
                                            </Button>
                                        </AlertDialogFooter>
                                    </form>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Enter the user information and choose a role to create the account.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input placeholder="Enter user name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="operator">Operator</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Branch</Label>
                                        <Select value={formData.branchId || 'none'} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No branch</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={async () => {
                                        try {
                                            await createUser(formData);
                                            setFormData({ name: '', email: '', password: '', role: 'operator', branchId: 'none' });
                                            setIsAddUserOpen(false);
                                            alert('User added');
                                        } catch (err) {
                                            console.error('Failed to create user', err);
                                            alert('Failed to add user');
                                        }
                                    }} className="bg-[#10b981] hover:bg-[#059669] text-white">
                                        Add User
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit User Modal */}
                    <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>Update user details and role.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input placeholder="Enter user name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="Enter email address" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password <span className="text-xs text-gray-400">(leave blank to keep)</span></Label>
                                    <Input type="password" placeholder="Enter new password" value={editFormData.password} onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="operator">Operator</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Branch</Label>
                                        <Select value={editFormData.branchId || 'none'} onValueChange={(value) => setEditFormData({ ...editFormData, branchId: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No branch</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveEdit} className="bg-[#10b981] hover:bg-[#059669] text-white">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete user</AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="py-4">Are you sure you want to delete this user? This action cannot be undone.</div>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete}>Delete</Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Branch Tabs */}
                    {selectedBranchIds.length > 0 ? (
                        <div className="mt-6">
                            <div className="flex flex-wrap gap-1 border-b border-gray-200">
                                {selectedBranchIds.map((branchId) => {
                                    const branch = branches.find((b) => b.id === branchId);
                                    if (!branch) return null;
                                    const isActive = activeTabId === branch.id;
                                    return (
                                        <button
                                            key={branch.id}
                                            onClick={() => setActiveTabId(branch.id)}
                                            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${isActive
                                                    ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px shadow-sm"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                }`}
                                        >
                                            {branch.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Branch Details */}
                            {activeBranch && (
                                <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-8 shadow-sm">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
                                        {/* Operators Section */}
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-lg text-gray-800">
                                                    Operators
                                                </h4>
                                                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                    {activeBranch.operators?.length || 0}
                                                </span>
                                            </div>
                                            {activeBranch.operators?.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {activeBranch.operators.map((op) => (
                                                        <li
                                                            key={op.id}
                                                            className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                                            onClick={() => openUserModal(op)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-lg font-semibold text-gray-700">
                                                                    {op.name ? op.name[0].toUpperCase() : "?"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-gray-900 truncate">
                                                                        {op.name || "—"}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                                                                            {op.role || "Operator"}
                                                                        </span>
                                                                        {op.email && (
                                                                            <span className="text-xs text-gray-400 truncate">
                                                                                {op.email}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(op); }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(op.id); }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-400 italic py-4">
                                                    No operators assigned
                                                </p>
                                            )}
                                        </div>

                                        {/* Managers Section */}
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-lg text-gray-800">
                                                    Managers
                                                </h4>
                                                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                    {activeBranch.managers?.length || 0}
                                                </span>
                                            </div>
                                            {activeBranch.managers?.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {activeBranch.managers.map((mgr) => (
                                                        <li
                                                            key={mgr.id}
                                                            className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                                            onClick={() => openUserModal(mgr)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-lg font-semibold text-gray-700">
                                                                    {mgr.name ? mgr.name[0].toUpperCase() : "?"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-gray-900 truncate">
                                                                        {mgr.name || "—"}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                                                                            {mgr.role || "Manager"}
                                                                        </span>
                                                                        {mgr.email && (
                                                                            <span className="text-xs text-gray-400 truncate">
                                                                                {mgr.email}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(mgr); }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(mgr.id); }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-400 italic py-4">
                                                    No managers assigned
                                                </p>
                                            )}
                                        </div>

                                        {/* Performance Section with Chart */}
                                        <div className="space-y-5">
                                            <h4 className="font-semibold text-lg text-gray-800">
                                                Performance
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg p-5">
                                                <div className="grid grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                            Revenue
                                                        </p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            $
                                                            {activeBranch.performance?.revenue?.toFixed(2) ??
                                                                "0.00"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                            SIMs Sold
                                                        </p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {activeBranch.performance?.simSold ?? 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-48">
                                                    <Bar
                                                        data={{
                                                            labels: ["Revenue", "SIM Sold"],
                                                            datasets: [
                                                                {
                                                                    label: activeBranch.name,
                                                                    data: [
                                                                        activeBranch.performance?.revenue || 0,
                                                                        activeBranch.performance?.simSold || 0,
                                                                    ],
                                                                    backgroundColor: [
                                                                        "rgba(16, 185, 129, 0.8)",
                                                                        "rgba(5, 150, 105, 0.8)",
                                                                    ],
                                                                    borderRadius: 8,
                                                                },
                                                            ],
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { display: false },
                                                                tooltip: { backgroundColor: "#1f2937" },
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    grid: { color: "#e5e7eb" },
                                                                    ticks: { color: "#4b5563" },
                                                                },
                                                                x: {
                                                                    grid: { display: false },
                                                                    ticks: { color: "#4b5563" },
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                No branches selected. Use the filter above to select branches.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Info Modal – placed at root level */}
            <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
                <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle>User Info & Performance</DialogTitle>
                        <DialogDescription>
                            View user profile details and activity summary.
                        </DialogDescription>
                    </DialogHeader>
                    {userModalData && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                                    <span>{userModalData.name?.[0] || "?"}</span>
                                </div>
                                <div>
                                    <div className="font-semibold text-lg">
                                        {userModalData.name}
                                    </div>
                                    <div className="text-gray-500 text-sm">
                                        {userModalData.email}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Role</div>
                                    <div className="font-semibold">{userModalData.role}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Joined</div>
                                    <div>{userModalData.joined || "-"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Session Status</div>
                                    <div>{userModalData.sessionStatus || "Inactive"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Session Expires</div>
                                    <div>{userModalData.sessionExpires || "-"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Last Login</div>
                                    <div>{userModalData.lastLogin || "-"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Last Logout</div>
                                    <div>{userModalData.lastLogout || "-"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                    <div className="text-xs text-gray-500">Last Session IP</div>
                                    <div>{userModalData.lastSessionIp || "::1"}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Sales</div>
                                    <div className="font-semibold">
                                        {userModalData.sales ?? 0}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">
                                        Total Transactions
                                    </div>
                                    <div className="font-semibold">
                                        {userModalData.totalTransactions ?? 0}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Completed</div>
                                    <div className="font-semibold text-green-600">
                                        {userModalData.completed ?? 0}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-xs text-gray-500">Pending/Failed</div>
                                    <div className="font-semibold text-orange-500">
                                        {userModalData.pending ?? 0}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                    <div className="text-xs text-gray-500">Last Activity</div>
                                    <div>{userModalData.lastActivity || "No activity yet"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
