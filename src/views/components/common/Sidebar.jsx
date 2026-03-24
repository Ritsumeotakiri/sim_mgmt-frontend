import { LayoutDashboard, CreditCard, Phone, History, Users, Settings, ChevronLeft, ChevronRight, LogOut, User, NotebookText } from 'lucide-react';
import { cn } from '@/lib/utils';
const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'operator', 'viewer'] },
   // { id: 'profile', label: 'Profile', icon: User, roles: ['admin', 'manager', 'operator', 'viewer'] },
    { id: 'sims', label: 'SIM Cards', icon: CreditCard, roles: ['admin', 'manager', 'operator', 'viewer'] },
    { id: 'plans', label: 'Plans', icon: NotebookText, roles: ['admin', 'manager', 'operator', 'viewer'] },
    { id: 'msisdns', label: 'MSISDNs', icon: Phone, roles: ['admin', 'manager'] },
    { id: 'transactions', label: 'Transactions', icon: History, roles: ['admin', 'manager', 'operator', 'viewer'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin', 'manager'] },
    { id: 'profile', label: 'Profile', icon: User, roles: ['admin', 'manager', 'operator', 'viewer'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];
export function Sidebar({ currentView, onViewChange, userRole, userName, onLogout, collapsed, onToggleCollapsed }) {
    const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));
    return (<aside className={cn("fixed left-0 top-0 h-screen bg-white border-r border-[#f3f3f3] transition-all duration-300 z-50", collapsed ? "w-20" : "w-64")}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-[#f3f3f3]">
          {!collapsed && (<div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1f1f1f] rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white"/>
              </div>
              <span className="font-semibold text-[#1f1f1f]">SIM Manager</span>
            </div>)}
          {collapsed && (<div className="w-8 h-8 bg-[#1f1f1f] rounded-lg flex items-center justify-center mx-auto">
              <CreditCard className="w-5 h-5 text-white"/>
            </div>)}
          {!collapsed && (<button onClick={onToggleCollapsed} className="p-1 hover:bg-[#f3f3f3] rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#828282]"/>
            </button>)}
          {collapsed && (<button onClick={onToggleCollapsed} className="absolute -right-3 top-6 w-6 h-6 bg-white border border-[#f3f3f3] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <ChevronRight className="w-3 h-3 text-[#828282]"/>
            </button>)}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (<li key={item.id}>
                  <button onClick={() => onViewChange(item.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200", isActive
                    ? "bg-[#f3f3f3] text-[#1f1f1f] font-medium"
                    : "text-[#828282] hover:bg-[#f3f3f3] hover:text-[#1f1f1f]")}>
                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-[#1f1f1f]")}/>
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </button>
                </li>);
        })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#f3f3f3]">
          <div className="flex items-center gap-3 w-full hover:bg-[#f3f3f3] rounded-lg p-2 transition-colors mb-2">
            <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center">
              <User className="w-4 h-4 text-[#828282]"/>
            </div>
            {!collapsed && (<div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium text-[#1f1f1f] truncate">{userName || 'User'}</p>
                <p className="text-xs text-[#828282] capitalize truncate">{userRole}</p>
              </div>)}
          </div>
          
          {onLogout && (<button onClick={onLogout} className="flex items-center gap-3 w-full hover:bg-[#e9423a]/10 rounded-lg p-2 transition-colors text-[#e9423a]">
              <LogOut className="w-4 h-4"/>
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>)}
        </div>
      </div>
    </aside>);
}
