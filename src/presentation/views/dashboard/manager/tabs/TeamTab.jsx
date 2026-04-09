import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';

export function TeamTab({ scopedTeamUsers = [], selectedTeamMember, setSelectedTeamMember, teamPerformanceByUserName = {} }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[#1f1f1f]">Team Members</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scopedTeamUsers.map((user) => (
          <button key={user.id} type="button" onClick={() => setSelectedTeamMember(user)} className="w-full text-left bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5 hover:border-[#5b93ff] hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-[#f3f3f3]"/>
              <div>
                <h4 className="font-medium text-[#1f1f1f]">{user.name}</h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-[#e9423a]/10 text-[#e9423a]' : user.role === 'manager' ? 'bg-[#5b93ff]/10 text-[#5b93ff]' : user.role === 'operator' ? 'bg-[#3ebb7f]/10 text-[#3ebb7f]' : 'bg-[#828282]/10 text-[#828282]'}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#f3f3f3]">
              <p className="text-sm text-[#828282]">{user.email}</p>
              <p className="text-xs text-[#828282] mt-1">{user.branchName || 'No branch'}</p>
              <p className="text-xs text-[#c9c7c7] mt-1">Joined {user.createdAt.toLocaleDateString()}</p>
            </div>
          </button>
        ))}
        {scopedTeamUsers.length === 0 && (<div className="col-span-full rounded-lg border border-[#f3f3f3] p-6 text-sm text-[#828282] text-center">No team members found in your branch.</div>)}
      </div>

      <Dialog open={Boolean(selectedTeamMember)} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedTeamMember(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Member Info & Performance</DialogTitle>
          </DialogHeader>
          {selectedTeamMember && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <img src={selectedTeamMember.avatar} alt={selectedTeamMember.name} className="w-14 h-14 rounded-full bg-[#f3f3f3]"/>
                <div>
                  <h4 className="font-semibold text-[#1f1f1f]">{selectedTeamMember.name}</h4>
                  <p className="text-sm text-[#828282]">{selectedTeamMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Role</p>
                  <p className="text-sm font-medium text-[#1f1f1f] capitalize">{selectedTeamMember.role}</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-lg p-3 border border-[#f3f3f3]">
                  <p className="text-xs text-[#828282]">Joined</p>
                  <p className="text-sm font-medium text-[#1f1f1f]">{selectedTeamMember.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Sales</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.salesCount || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Total Transactions</p>
                  <p className="text-base font-semibold text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.totalTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Completed</p>
                  <p className="text-base font-semibold text-[#3ebb7f]">{teamPerformanceByUserName[selectedTeamMember.name]?.completedTransactions || 0}</p>
                </div>
                <div className="bg-[#f3f3f3] rounded-lg p-3">
                  <p className="text-xs text-[#828282]">Pending/Failed</p>
                  <p className="text-base font-semibold text-[#f6a94c]">{(teamPerformanceByUserName[selectedTeamMember.name]?.pendingTransactions || 0) + (teamPerformanceByUserName[selectedTeamMember.name]?.failedTransactions || 0)}</p>
                </div>
              </div>

              <div className="bg-white border border-[#f3f3f3] rounded-lg p-3">
                <p className="text-xs text-[#828282]">Last Activity</p>
                <p className="text-sm font-medium text-[#1f1f1f]">{teamPerformanceByUserName[selectedTeamMember.name]?.lastActivity
                    ? teamPerformanceByUserName[selectedTeamMember.name].lastActivity.toLocaleString()
                    : 'No activity yet'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeamTab;
