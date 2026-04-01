import { Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/presentation/components/ui/dropdown-menu';
export function Header({ title, subtitle }) {
    return (<header className="h-16 bg-white border-b border-[#f3f3f3] flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-semibold text-[#1f1f1f]">{title}</h1>
        {subtitle && <p className="text-sm text-[#828282]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
          <input type="text" placeholder="Search..." className="w-64 pl-10 pr-4 py-2 bg-[#f3f3f3] border-0 rounded-lg text-sm text-[#1f1f1f] placeholder:text-[#828282] focus:outline-none focus:ring-2 focus:ring-[#1f1f1f]/10 transition-all"/>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-[#f3f3f3]">
              <Bell className="w-5 h-5 text-[#828282]"/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#e9423a] rounded-full"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b border-[#f3f3f3]">
              <p className="font-medium text-sm">Notifications</p>
            </div>
            <div className="max-h-64 overflow-auto">
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-[#f6a94c] rounded-full mt-1.5"/>
                  <div>
                    <p className="text-sm text-[#1f1f1f]">New SIM pending activation</p>
                    <p className="text-xs text-[#828282]">2 minutes ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-[#3ebb7f] rounded-full mt-1.5"/>
                  <div>
                    <p className="text-sm text-[#1f1f1f]">SIM transfer completed</p>
                    <p className="text-xs text-[#828282]">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#f3f3f3]">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="User" className="w-8 h-8 rounded-full bg-[#f3f3f3]"/>
              <ChevronDown className="w-4 h-4 text-[#828282]"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-[#e9423a]">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>);
}

