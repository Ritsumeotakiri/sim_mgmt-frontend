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
import { createUser } from "@/data/services/backendApi/user";

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
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col items-end space-y-2">
                            {/* Add User Button */}
                            <div>
                                <Button onClick={() => setIsAddUserOpen(true)} className="gap-2 ml-3 bg-blue-600 hover:bg-blue-700 text-white">
                                    <Plus className="w-4 h-4" />
                                    Add User
                                </Button>
                            </div>

                            {/* Add Branch (moved under Add User) */}
                            <div>
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

                        {/* Add User Dialog */}
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
                                    {/* Avatar removed */}
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
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3">
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

                        {selectedBranchIds.length > 0 && (
                            <span className="text-sm text-gray-500">
                                {selectedBranchIds.length} branch
                                {selectedBranchIds.length > 1 ? "es" : ""} selected
                            </span>
                        )}
                    </div>

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
                                                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:shadow-sm transition-shadow cursor-pointer"
                                                            onClick={() => openUserModal(op)}
                                                        >
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-gray-800 text-base">
                                                                    {op.name || "—"}
                                                                </p>
                                                                <p className="text-sm text-emerald-700 font-medium">
                                                                    {op.role || "Operator"}
                                                                </p>
                                                                {op.email && (
                                                                    <p className="text-xs text-gray-400">
                                                                        {op.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                                    onClick={(e) => e.stopPropagation()}
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
                                                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:shadow-sm transition-shadow cursor-pointer"
                                                            onClick={() => openUserModal(mgr)}
                                                        >
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-gray-800 text-base">
                                                                    {mgr.name || "—"}
                                                                </p>
                                                                <p className="text-sm text-blue-700 font-medium">
                                                                    {mgr.role || "Manager"}
                                                                </p>
                                                                {mgr.email && (
                                                                    <p className="text-xs text-gray-400">
                                                                        {mgr.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                                    onClick={(e) => e.stopPropagation()}
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
