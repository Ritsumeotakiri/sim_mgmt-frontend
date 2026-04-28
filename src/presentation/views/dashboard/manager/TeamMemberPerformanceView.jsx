import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PerformanceTabView } from '@/presentation/views/operator/tabs/PerformanceTabView';
import { usePerformanceMetrics } from '@/presentation/viewModels/operator/hooks/usePerformanceMetrics';

export function TeamMemberPerformanceView({ memberId, sims = [], customers = [], transactions = [], users = [], onBack }) {
  const navigate = useNavigate();

  const member = useMemo(() => {
    if (!memberId) return null;
    return users.find((u) => String(u.id) === String(memberId) || String(u.userId) === String(memberId) || String(u.username) === String(memberId)) || null;
  }, [users, memberId]);

  const operatorTransactions = useMemo(() => {
    if (!member) return [];
    const targetName = String(member.name || member.username || '').toLowerCase();
    const targetId = member.id != null ? String(member.id) : null;
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    return transactions.filter((tx) => {
      const txUserName = String(tx.userName || tx.username || '').toLowerCase();
      const txUserId = tx.userId || tx.user_id || tx.user || null;
      if (targetName && txUserName === targetName) return true;
      if (targetId && String(txUserId) === targetId) return true;
      return false;
    });
  }, [transactions, member]);

  const metrics = usePerformanceMetrics(customers, sims, operatorTransactions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded border" onClick={() => (onBack ? onBack() : navigate('/dashboard'))}>Back</button>
          <div>
            <h2 className="text-lg font-semibold">{member ? member.name : 'Team Member'}</h2>
            <p className="text-sm text-[#828282]">Performance details</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#f3f3f3] p-5">
        <PerformanceTabView performanceMetrics={metrics} />
      </div>
    </div>
  );
}

export default TeamMemberPerformanceView;
