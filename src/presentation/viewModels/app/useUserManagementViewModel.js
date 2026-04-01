import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { backendApi } from '@/data/services/backendApi';
import { isAuthExpiredError } from '@/data/services/backendApi/client';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { mapUser } from '@/data/services/backendApi/mappers';
export function useUserManagementViewModel({ isAuthenticated, authToken }) {
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    const reloadUsers = () => {
        setRefreshKey((previous) => previous + 1);
    };
    useEffect(() => {
        if (!isAuthenticated || !authToken) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUsers([]);
            setTotalUsers(0);
            return;
        }

        const loadUsers = async () => {
            try {
                const response = await apiRequestWithMeta(`${ENDPOINTS.users.list}?page=1&pageSize=25`);
                setUsers((response.data || []).map(mapUser));
                setTotalUsers(response.pagination?.totalRecords || 0);
            }
            catch (error) {
                if (isAuthExpiredError(error)) {
                    return;
                }
                toast.error(error instanceof Error ? error.message : 'Failed to load users');
            }
        };
        loadUsers();
    }, [isAuthenticated, authToken, refreshKey]);
    const handleAddUser = async (userData) => {
        try {
            const created = await backendApi.createUser(userData);
            setUsers(prev => [...prev, created]);
            reloadUsers();
            toast.success('User added successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add user');
            return false;
        }
    };
    const handleEditUser = async (user) => {
        try {
            const updated = await backendApi.updateUser(user);
            setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
            reloadUsers();
            toast.success('User updated successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update user');
            return false;
        }
    };
    const handleDeleteUser = async (id) => {
        try {
            await backendApi.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            reloadUsers();
            toast.success('User deleted successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete user');
            return false;
        }
    };
    const handleAddBranch = async (branchData) => {
        try {
            await backendApi.createBranch(branchData);
            reloadUsers();
            toast.success('Branch added successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add branch');
            return false;
        }
    };
    return {
        users,
        totalUsers,
        reloadUsers,
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
        handleAddBranch,
    };
}

