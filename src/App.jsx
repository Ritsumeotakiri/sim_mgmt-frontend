import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/viewModels/useAuth';
import { useSIMManagement } from '@/viewModels/useSIMManagement';
import { useUserManagement } from '@/viewModels/useUserManagement';
import { useMSISDNManagement } from '@/viewModels/useMSISDNManagement';

import { Dashboard } from '@/views/pages/dashboard/admin/Dashboard';
import { BranchPerformanceDetail } from '@/views/pages/BranchPerformanceDetail';
import { LoginPage } from '@/views/pages/LoginPage';
import { OperatorDashboard } from '@/views/pages/dashboard/operator/OperatorDashboard';
import { ManagerDashboard } from '@/views/pages/dashboard/manager/ManagerDashboard';
import { SIMTable } from '@/views/components/sim/SIMTable';
import { MSISDNInventory } from '@/views/components/msisdn/MSISDNInventory';
import { TransactionsTable } from '@/views/components/transaction/TransactionsTable';
import { CustomersTable } from '@/views/components/customer/CustomersTable';
import { PlansManagement } from '@/views/components/plan/PlansManagement';
import { UserManagement } from '@/views/components/user/UserManagement';
import { SIMFormModal } from '@/views/components/sim/SIMFormModal';
import { SellSIMModal } from '@/views/components/sim/SellSIMModal';
import { ProfilePage } from '@/views/pages/ProfilePage';
import { SettingsPage } from '@/views/pages/SettingsPage';
import { MainLayout } from '@/views/layouts/MainLayout';

const VIEW_TO_PATH = {
    dashboard: '/dashboard',
    sims: '/sims',
    plans: '/plans',
    customers: '/customers',
    msisdns: '/msisdns',
    transactions: '/transactions',
    users: '/users',
    profile: '/profile',
    settings: '/settings',
};

const PATH_TO_VIEW = Object.entries(VIEW_TO_PATH).reduce((acc, [view, path]) => {
    acc[path] = view;
    return acc;
}, {});

function App() {
    // ========== ViewModels ==========
    const { auth, handleLogin, handleLogout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const simManagement = useSIMManagement({
        userName: auth.userName,
        isAuthenticated: auth.isAuthenticated,
        authToken: auth.token,
        userRole: auth.userRole,
        userBranchId: auth.userBranchId,
    });
    const userManagement = useUserManagement({
        isAuthenticated: auth.isAuthenticated,
        authToken: auth.token,
    });
    const msisdnManagement = useMSISDNManagement();
    // ========== View State ==========
    const [currentView, setCurrentView] = useState('dashboard');
    const [notificationsClearedAt, setNotificationsClearedAt] = useState(() => {
        try {
            const raw = window.localStorage.getItem('sim-notifications-cleared-at');
            return raw ? Number(raw) : null;
        }
        catch {
            return null;
        }
    });
    const [batchOperationsEnabled, setBatchOperationsEnabled] = useState(() => {
        try {
            const value = window.localStorage.getItem('sim-admin-batch-ops');
            return value ? value === 'true' : false;
        }
        catch {
            return false;
        }
    });
    const handleToggleBatchOperations = (enabled) => {
        setBatchOperationsEnabled(enabled);
        try {
            window.localStorage.setItem('sim-admin-batch-ops', String(enabled));
        }
        catch {
            // ignore storage errors
        }
    };

    const simDetailIdFromPath = useMemo(() => {
        const match = location.pathname.match(/^\/sims\/(\d+)$/);
        return match ? Number(match[1]) : null;
    }, [location.pathname]);

    const branchDetailNameFromPath = useMemo(() => {
        const match = location.pathname.match(/^\/dashboard\/branches\/(.+)$/);
        return match ? decodeURIComponent(match[1]) : null;
    }, [location.pathname]);

    const handleClearNotifications = () => {
        const clearedAt = Date.now();
        setNotificationsClearedAt(clearedAt);
        try {
            window.localStorage.setItem('sim-notifications-cleared-at', String(clearedAt));
        }
        catch {
            // ignore storage errors
        }
    };

    const allNotifications = useMemo(() => {
        const transactionNotifications = simManagement.transactions.map((transaction) => {
            const timestamp = transaction.date instanceof Date ? transaction.date : new Date(transaction.date || 0);
            const normalizedType = String(transaction.type || transaction.transactionType || 'transaction').replace(/_/g, ' ');
            const normalizedStatus = String(transaction.status || '').toLowerCase();
            const isCompleted = normalizedStatus === 'completed';
            const message = isCompleted
                ? `${normalizedType.charAt(0).toUpperCase()}${normalizedType.slice(1)} completed`
                : `${normalizedType.charAt(0).toUpperCase()}${normalizedType.slice(1)} ${normalizedStatus || 'updated'}`;

            return {
                id: `tx-${transaction.id || timestamp.getTime()}`,
                message,
                timestamp,
                tone: isCompleted ? 'success' : normalizedStatus === 'pending' ? 'warning' : 'neutral',
            };
        });

        const pendingSimNotifications = simManagement.sims
            .filter((sim) => sim.status === 'pending')
            .map((sim) => ({
            id: `sim-${sim.id}`,
            message: `SIM ${sim.iccid || sim.id} pending activation`,
            timestamp: sim.updatedAt || sim.createdAt || new Date(0),
            tone: 'warning',
        }));

        return [...transactionNotifications, ...pendingSimNotifications]
            .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
            .filter((notification) => {
            if (!notificationsClearedAt) {
                return true;
            }
            const notificationTime = new Date(notification.timestamp).getTime();
            return Number.isFinite(notificationTime) && notificationTime > notificationsClearedAt;
        });
    }, [notificationsClearedAt, simManagement.transactions, simManagement.sims]);

    const handleLoginAndResetView = async (identifier, password) => {
        const success = await handleLogin(identifier, password);
        if (success) {
            setCurrentView('dashboard');
            navigate(VIEW_TO_PATH.dashboard, { replace: true });
        }
        return success;
    };

    const navigateToView = (view, options) => {
        const nextPath = VIEW_TO_PATH[view] || VIEW_TO_PATH.dashboard;
        setCurrentView(view in VIEW_TO_PATH ? view : 'dashboard');
        navigate(nextPath, options);
    };

    const handleLogoutAndNavigate = () => {
        handleLogout();
        setCurrentView('dashboard');
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        if (!auth.isAuthenticated) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentView('dashboard');
            return;
        }

        if (location.pathname === '/' || location.pathname === '') {
            navigate(VIEW_TO_PATH.dashboard, { replace: true });
            return;
        }

        const mappedView = PATH_TO_VIEW[location.pathname];
        const inferredView = mappedView || (location.pathname.startsWith('/sims/') ? 'sims' : location.pathname.startsWith('/dashboard/branches/') ? 'dashboard' : null);
        if (!inferredView) {
            navigate(VIEW_TO_PATH.dashboard, { replace: true });
            return;
        }

        if (inferredView !== currentView) {
            setCurrentView(inferredView);
        }
    }, [auth.isAuthenticated, currentView, location.pathname, navigate]);

    const userRole = auth.userRole;
    // ========== Page Configuration ==========
    const getPageInfo = () => {
        if (branchDetailNameFromPath) {
            return { title: branchDetailNameFromPath, subtitle: 'Branch dashboard and team details' };
        }
        switch (currentView) {
            case 'dashboard': return { title: 'Dashboard', subtitle: `Welcome back, ${auth.userName}` };
            case 'profile': return { title: 'Profile', subtitle: 'Manage your profile information' };
            case 'sims': return { title: 'SIM Cards', subtitle: 'Manage all your SIM cards' };
            case 'plans': return { title: 'Plans', subtitle: 'Manage plan catalog and pricing' };
            case 'customers': return { title: 'Customers', subtitle: 'View registered customers' };
            case 'msisdns': return { title: 'MSISDN Inventory', subtitle: 'Manage phone number pool' };
            case 'transactions': return { title: 'Transactions', subtitle: 'View all SIM transactions' };
            case 'users': return { title: 'User Management', subtitle: 'Manage system users and roles' };
            case 'settings': return { title: 'Settings', subtitle: 'Configure system settings' };
            default: return { title: 'Dashboard', subtitle: '' };
        }
    };
    const pageInfo = getPageInfo();
    const searchNavigationOptions = useMemo(() => {
        const baseOptions = [
            { id: 'dashboard', label: 'Dashboard', description: 'Overview and performance', keywords: ['home', 'overview'] },
            { id: 'sims', label: 'SIM Cards', description: 'Manage SIM cards', keywords: ['sim', 'cards'] },
            { id: 'plans', label: 'Plans', description: 'Plan catalog and pricing', keywords: ['packages', 'pricing'] },
            { id: 'customers', label: 'Customers', description: 'Customer records and details', keywords: ['customer', 'client'] },
            { id: 'msisdns', label: 'MSISDN Inventory', description: 'Phone number pool', keywords: ['msisdn', 'numbers'] },
            { id: 'transactions', label: 'Transactions', description: 'SIM sales and status changes', keywords: ['payments', 'history'] },
            { id: 'profile', label: 'Profile', description: 'Your account information', keywords: ['account', 'me'] },
        ];

        if (userRole === 'admin') {
            baseOptions.push({ id: 'users', label: 'User Management', description: 'Manage system users', keywords: ['users', 'roles'] });
            baseOptions.push({ id: 'settings', label: 'Settings', description: 'System configuration', keywords: ['config', 'preferences'] });
        }

        return baseOptions;
    }, [userRole]);
    // ========== Render Dashboard by Role ==========
    const renderDashboard = () => {
        switch (userRole) {
            case 'operator':
                return (<OperatorDashboard sims={simManagement.sims} msisdns={simManagement.msisdns} customers={simManagement.customers} plans={simManagement.plans} transactions={simManagement.transactions} stats={simManagement.stats} operatorPerformance={simManagement.operatorPerformance} currentUserIdentifier={auth.userEmail || ''} onSellSIM={simManagement.completeSale} onAddCustomer={simManagement.handleAddCustomer}/>);
            case 'manager':
                return (<ManagerDashboard sims={simManagement.sims} msisdns={simManagement.msisdns} transactions={simManagement.transactions} users={userManagement.users} totalUsers={userManagement.totalUsers} currentUserBranchId={auth.userBranchId} stats={simManagement.stats} onAddSIM={simManagement.handleAddSIM} onEditSIM={simManagement.handleEditSIM} onBatchImportSIM={simManagement.handleImportSIMBatch}/>);
            case 'admin':
            case 'viewer':
            default:
                return (<Dashboard stats={simManagement.stats} recentSIMs={simManagement.recentSIMs} userRole={userRole} onEditSIM={simManagement.openEditSIMModal} onDeleteSIM={simManagement.handleDeleteSIM} onAddSIM={simManagement.openAddSIMModal} onSellSIM={userRole === 'admin' ? simManagement.handleSellSIM : undefined} operatorPerformance={simManagement.operatorPerformance} users={userManagement.users} onOpenUserManagement={userRole === 'admin' ? () => navigateToView('users') : undefined} onOpenSIMManagement={() => navigateToView('sims')} onOpenTransactionsManagement={() => navigateToView('transactions')} onOpenBranchDetail={(branchName) => navigate(`/dashboard/branches/${encodeURIComponent(branchName)}`)}/>);
        }
    };
    // ========== Render Content by View ==========
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                if (userRole === 'admin' && branchDetailNameFromPath) {
                    return (<BranchPerformanceDetail branchName={branchDetailNameFromPath} operatorPerformance={simManagement.operatorPerformance} users={userManagement.users} onBack={() => navigate('/dashboard')} onOpenUserManagement={() => navigateToView('users')} onOpenSIMManagement={() => navigateToView('sims')} onOpenTransactionsManagement={() => navigateToView('transactions')}/>);
                }
                return renderDashboard();
            case 'sims':
                return (<SIMTable sims={simManagement.sims} userRole={userRole} onEdit={userRole === 'viewer' || userRole === 'operator' ? () => { } : simManagement.openEditSIMModal} onDelete={userRole === 'admin' ? simManagement.handleDeleteSIM : () => { }} onAdd={userRole === 'admin' || userRole === 'manager' ? simManagement.openAddSIMModal : () => { }} onSell={userRole === 'admin' || userRole === 'operator' ? simManagement.handleSellSIM : undefined} batchModeEnabled={userRole === 'admin' ? batchOperationsEnabled : false} onBulkUpdateStatus={userRole === 'admin' ? simManagement.handleBulkUpdateSIMStatus : undefined} onBulkUpdateBranch={userRole === 'admin' ? simManagement.handleBulkUpdateSIMBranch : undefined} onBulkDelete={userRole === 'admin' ? simManagement.handleBulkDeleteSIMs : undefined} useServerPagination={true} selectedSimId={simDetailIdFromPath} onOpenSimDetail={(simId) => navigate(`/sims/${simId}`)} onCloseSimDetail={() => navigate('/sims')}/>);
            case 'plans':
                return (<PlansManagement plans={simManagement.plans} canEdit={userRole === 'admin' || userRole === 'manager'} onAdd={userRole === 'admin' || userRole === 'manager' ? simManagement.handleAddPlan : undefined} onEdit={userRole === 'admin' || userRole === 'manager' ? simManagement.handleEditPlan : undefined} onDelete={userRole === 'admin' || userRole === 'manager' ? simManagement.handleDeletePlan : undefined}/>);
            case 'profile':
                return (<ProfilePage userName={auth.userName} userEmail={auth.userEmail || ''} userRole={userRole}/>);
            case 'msisdns':
                return (<MSISDNInventory msisdns={simManagement.msisdns} onAdd={userRole === 'admin' ? (data) => msisdnManagement.handleAddMSISDN(data, simManagement.setMsisdns) : undefined} onBatchImport={userRole === 'admin' ? (payload) => msisdnManagement.handleImportMSISDNBatch(payload, simManagement.setMsisdns) : undefined} onEdit={userRole === 'admin' ? (data) => msisdnManagement.handleEditMSISDN(data, simManagement.setMsisdns) : undefined} onDelete={userRole === 'admin' ? (id) => msisdnManagement.handleDeleteMSISDN(id, simManagement.setMsisdns) : undefined} useServerPagination={true}/>);
            case 'customers':
                return (<CustomersTable customers={simManagement.customers} transactions={simManagement.transactions} sims={simManagement.sims} plans={simManagement.plans} onAdd={userRole !== 'viewer' ? simManagement.handleAddCustomer : undefined} onEdit={userRole !== 'viewer' ? simManagement.handleEditCustomer : undefined} onDelete={userRole === 'admin' || userRole === 'manager' ? simManagement.handleDeleteCustomer : undefined} useServerPagination={true}/>);
            case 'transactions':
                return <TransactionsTable transactions={simManagement.transactions} useServerPagination={true}/>;
            case 'users':
                return (<UserManagement users={userManagement.users} transactions={simManagement.transactions} onAdd={userRole === 'admin' ? userManagement.handleAddUser : undefined} onEdit={userRole === 'admin' ? userManagement.handleEditUser : undefined} onDelete={userRole === 'admin' ? userManagement.handleDeleteUser : undefined} useServerPagination={true}/>);
            case 'settings':
                return (<SettingsPage userRole={userRole} batchOperationsEnabled={batchOperationsEnabled} onToggleBatchOperations={handleToggleBatchOperations} onAddBranch={userRole === 'admin' ? userManagement.handleAddBranch : undefined} operatorPerformance={simManagement.operatorPerformance}/>);
            default:
                return renderDashboard();
        }
    };
        const appContent = (<>
                <MainLayout currentView={currentView} onViewChange={(view) => navigateToView(view)} userRole={userRole} userName={auth.userName} onLogout={handleLogoutAndNavigate} onProfileClick={() => navigateToView('profile')} onSettingsClick={() => navigateToView('settings')} canAccessSettings={userRole === 'admin'} searchNavigationOptions={searchNavigationOptions} onNavigateFromSearch={(view) => navigateToView(view)} pageTitle={pageInfo.title} pageSubtitle={pageInfo.subtitle} notifications={allNotifications} onClearNotifications={handleClearNotifications}>
                    {renderContent()}
                </MainLayout>

                {(userRole === 'admin' || userRole === 'manager') && (<SIMFormModal isOpen={simManagement.isSIMModalOpen} onClose={() => {
                                        simManagement.setIsSIMModalOpen(false);
                                        simManagement.setEditingSIM(null);
                        }} onSave={simManagement.editingSIM ? simManagement.handleEditSIM : simManagement.handleAddSIM} onBatchImport={simManagement.handleImportSIMBatch} sim={simManagement.editingSIM}/>)}

                {(userRole === 'admin' || userRole === 'operator') && (<SellSIMModal isOpen={simManagement.isSellModalOpen} onClose={() => {
                                        simManagement.setIsSellModalOpen(false);
                                        simManagement.setSellingSIM(null);
                                }} onSell={simManagement.completeSale} sim={simManagement.sellingSIM} availableMSISDNs={simManagement.availableMSISDNs} customers={simManagement.customers} plans={simManagement.plans}/>)}
            </>);

        return (<>
            <Toaster position="top-right" richColors/>
            <Routes>
                <Route path="/login" element={auth.isAuthenticated ? <Navigate to={VIEW_TO_PATH.dashboard} replace/> : <LoginPage onLogin={handleLoginAndResetView}/>}/>
                <Route path="*" element={auth.isAuthenticated ? appContent : <Navigate to="/login" replace/>}/>
            </Routes>
        </>);
}
export default App;
