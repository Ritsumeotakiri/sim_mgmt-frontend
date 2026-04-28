import { useState } from 'react';
import { Sidebar } from '@/presentation/views/components/common/Sidebar';
import { Header } from '@/presentation/views/components/common/Header';
export function MainLayoutView({ currentView, onViewChange, userRole, userName, onLogout, pageTitle, pageSubtitle, notifications = [], onClearNotifications, onProfileClick, onSettingsClick, canAccessSettings = false, searchNavigationOptions = [], onNavigateFromSearch, children, }) {
    const [collapsed, setCollapsed] = useState(false);
    const showGlobalSearch = userRole === 'admin' || userRole === 'manager';
    return (<div className="min-h-screen bg-white">
      <Sidebar currentView={currentView} onViewChange={onViewChange} userRole={userRole} userName={userName} onLogout={onLogout} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)}/>
      
      <main className={`min-h-screen transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header title={pageTitle} subtitle={pageSubtitle} notifications={notifications} onClearNotifications={onClearNotifications} onProfileClick={onProfileClick} onSettingsClick={onSettingsClick} onLogoutClick={onLogout} canAccessSettings={canAccessSettings} navigationOptions={searchNavigationOptions} onNavigateFromSearch={onNavigateFromSearch} showGlobalSearch={showGlobalSearch}/>
        
        <div className="p-1">
          {children}
        </div>
      </main>
    </div>);
}

