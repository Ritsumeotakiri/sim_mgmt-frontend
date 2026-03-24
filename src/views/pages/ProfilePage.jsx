import { Mail, Shield, User as UserIcon } from 'lucide-react';
export function ProfilePage({ userName, userEmail, userRole }) {
  return (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6 w-full">
      <div className="flex items-center gap-4 mb-6">
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Profile" className="w-20 h-20 rounded-full bg-[#f3f3f3]"/>
        <div>
          <h2 className="text-xl font-semibold text-[#1f1f1f]">{userName}</h2>
          <p className="text-sm text-[#828282] capitalize">{userRole}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[#f3f3f3]">
          <p className="text-xs text-[#828282] mb-2">Full Name</p>
          <p className="text-sm text-[#1f1f1f] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#828282]"/>
            {userName}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#f3f3f3]">
          <p className="text-xs text-[#828282] mb-2">Email</p>
          <p className="text-sm text-[#1f1f1f] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#828282]"/>
            {userEmail || '-'}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#f3f3f3] md:col-span-2">
          <p className="text-xs text-[#828282] mb-2">Role & Permissions</p>
          <p className="text-sm text-[#1f1f1f] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#828282]"/>
            {userRole === 'admin' && 'Administrator - full access'}
            {userRole === 'manager' && 'Manager - operational management access'}
            {userRole === 'operator' && 'Operator - sales and transaction access'}
            {userRole === 'viewer' && 'Viewer - read-only access'}
          </p>
        </div>
      </div>
    </div>);
}
