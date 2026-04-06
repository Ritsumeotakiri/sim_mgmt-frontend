import { useState } from 'react';
import { Search, Bell, } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
function formatRelativeTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  const deltaMs = Date.now() - date.getTime();
  const seconds = Math.max(Math.floor(deltaMs / 1000), 0);
  if (seconds < 60)
    return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const toneClassName = {
  success: 'bg-[#3ebb7f]',
  warning: 'bg-[#f6a94c]',
  danger: 'bg-[#e9423a]',
  neutral: 'bg-[#828282]',
};

export function Header({ title, subtitle, notifications = [], onClearNotifications,  navigationOptions = [], onNavigateFromSearch, showGlobalSearch = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAllNotificationsOpen, setIsAllNotificationsOpen] = useState(false);
  const previewNotifications = notifications.slice(0, 8);
  const hasNotifications = notifications.length > 0;
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredNavigationOptions = normalizedQuery
    ? navigationOptions.filter((option) => option.label.toLowerCase().includes(normalizedQuery) || option.keywords?.some((keyword) => keyword.toLowerCase().includes(normalizedQuery)))
    : [];
  const handleNavigate = (option) => {
    setSearchTerm('');
    if (typeof onNavigateFromSearch === 'function') {
      onNavigateFromSearch(option.id);
    }
  };
    return (<header className="h-16 bg-white border-b border-[#f3f3f3] flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f]">{title}</h1>
        {subtitle && <p className="text-sm text-[#828282]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        {showGlobalSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
            <input type="text" placeholder="Quick jump..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && filteredNavigationOptions.length > 0) {
                handleNavigate(filteredNavigationOptions[0]);
              }
            }} className="w-64 pl-10 pr-4 py-2 bg-[#f3f3f3] border-0 rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all"/>
            {filteredNavigationOptions.length > 0 && (<div className="absolute top-full mt-2 w-full bg-white border border-[#f3f3f3] rounded-lg shadow-sm overflow-hidden z-50">
                {filteredNavigationOptions.slice(0, 6).map((option) => (<button key={option.id} type="button" onClick={() => handleNavigate(option)} className="w-full text-left px-3 py-2 hover:bg-[#f9f9f9] transition-colors border-b border-[#f3f3f3] last:border-b-0">
                    <p className="text-sm text-[#1f1f1f]">{option.label}</p>
                    {option.description && <p className="text-xs text-[#828282]">{option.description}</p>}
                  </button>))}
              </div>)}
          </div>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-[#f3f3f3]">
              <Bell className="w-5 h-5 text-[#828282]"/>
              {hasNotifications && <span className="absolute top-1 right-1 w-2 h-2 bg-[#e9423a] rounded-full"/>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b border-[#f3f3f3] flex items-center justify-between gap-2">
              <p className="font-medium text-sm">Notifications</p>
              {hasNotifications && (<button type="button" onClick={onClearNotifications} className="text-xs text-[#828282] hover:text-[#1f1f1f] transition-colors">
                  Clear all
                </button>)}
            </div>
            <div className="max-h-64 overflow-auto">
              {hasNotifications ? (previewNotifications.map((notification) => (<DropdownMenuItem key={notification.id} className="p-3 cursor-default focus:bg-[#f9f9f9]">
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${toneClassName[notification.tone] || toneClassName.neutral}`}/>
                      <div>
                        <p className="text-sm text-[#1f1f1f]">{notification.message}</p>
                        <p className="text-xs text-[#828282]">{formatRelativeTime(notification.timestamp)}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>))) : (<div className="p-3 text-sm text-[#828282]">No new notifications</div>)}
            </div>
            {hasNotifications && (<div className="p-2 border-t border-[#f3f3f3]">
                <button type="button" onClick={() => setIsAllNotificationsOpen(true)} className="w-full text-left text-sm text-[#1f1f1f] hover:bg-[#f9f9f9] rounded-md px-2 py-1.5 transition-colors">
                  View all notifications
                </button>
              </div>)}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu removed for cleaner UI */}
      </div>

      <Dialog open={isAllNotificationsOpen} onOpenChange={setIsAllNotificationsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Notifications</DialogTitle>
            <DialogDescription>Review all recent system and transaction updates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {hasNotifications ? (notifications.map((notification) => (<div key={`all-${notification.id}`} className="flex gap-3 p-3 rounded-lg border border-[#f3f3f3]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${toneClassName[notification.tone] || toneClassName.neutral}`}/>
                  <div>
                    <p className="text-sm text-[#1f1f1f]">{notification.message}</p>
                    <p className="text-xs text-[#828282]">{formatRelativeTime(notification.timestamp)}</p>
                  </div>
                </div>))) : (<p className="text-sm text-[#828282]">No notifications available.</p>)}
          </div>
        </DialogContent>
      </Dialog>
    </header>);
}

