import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export function TeamTab({ scopedTeamUsers = [], selectedTeamMember, setSelectedTeamMember, teamPerformanceByUserName = {}, transactions = [], sims = [], customers = [] }) {
  const navigate = useNavigate();

  const handleOpenMemberPage = (user) => {
    const id = encodeURIComponent(user.id ?? user.userId ?? user.username ?? '');
    navigate(`/dashboard/team/member/${id}`);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[#1f1f1f]">Team Members</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scopedTeamUsers.map((user) => (
          <button key={user.id} type="button" onClick={() => handleOpenMemberPage(user)} className="w-full text-left bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5 hover:border-[#5b93ff] hover:shadow-md transition-all">
            <div className="flex items-center">
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

      {/* Clicking a team member navigates to a dedicated performance page */}
    </div>
  );
}

export default TeamTab;
