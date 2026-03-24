import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { backendApi } from '@/services/backendApi';
import { isAuthExpiredError } from '@/services/backendApi/client';
import { ENDPOINTS } from '@/services/endpoints';
import { apiRequestWithMeta } from '@/services/backendApi/client';
import { mapUser } from '@/services/backendApi/mappers';
export function useUserManagement({ isAuthenticated, authToken }) {
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
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
    }, [isAuthenticated, authToken]);
    const handleAddUser = async (userData) => {
        try {
            const created = await backendApi.createUser(userData);
            setUsers(prev => [...prev, created]);
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
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
        handleAddBranch,
    };
}
