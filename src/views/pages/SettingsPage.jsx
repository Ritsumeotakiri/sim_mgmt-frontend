import { useMemo, useState } from 'react';
import { Building2, Layers } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SettingsPage({ userRole, batchOperationsEnabled, onToggleBatchOperations, onAddBranch, operatorPerformance = [], }) {
    const isAdmin = userRole === 'admin';
  const [branchForm, setBranchForm] = useState({ name: '', location: '' });
  const [addingBranch, setAddingBranch] = useState(false);

  const handleAddBranch = async () => {
    if (!isAdmin || typeof onAddBranch !== 'function') {
      return;
    }
    if (!branchForm.name.trim()) {
      return;
    }

    setAddingBranch(true);
    const success = await onAddBranch({
      name: branchForm.name.trim(),
      location: branchForm.location.trim(),
    });
    setAddingBranch(false);

    if (success) {
      setBranchForm({ name: '', location: '' });
    }
  };

  const branchPerformance = useMemo(() => {
    const grouped = operatorPerformance.reduce((acc, item) => {
      const branchName = item.branch_name || 'No Branch';
      if (!acc[branchName]) {
        acc[branchName] = {
          branchName,
          operators: 0,
          simSold: 0,
          revenue: 0,
          actions: 0,
        };
      }

      acc[branchName].operators += 1;
      acc[branchName].simSold += Number(item.sim_sales_count || 0);
      acc[branchName].revenue += Number(item.sim_sales_amount || 0);
      acc[branchName].actions += Number(item.total_system_actions || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((first, second) => second.simSold - first.simSold);
  }, [operatorPerformance]);

    return (<div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1f1f1f] mb-1">System Settings</h2>
        <p className="text-sm text-[#828282]">Configure admin features.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-[#1f1f1f]"/>
          <h3 className="font-semibold text-[#1f1f1f]">Batch Operations</h3>
        </div>

        <label className="flex items-center justify-between gap-4 p-4 rounded-lg border border-[#f3f3f3]">
          <div>
            <p className="text-sm font-medium text-[#1f1f1f]">Enable SIM batch operation mode</p>
            <p className="text-xs text-[#828282]">Allows admin to select multiple SIMs for bulk status update and delete.</p>
          </div>
          <input type="checkbox" checked={batchOperationsEnabled} disabled={!isAdmin} onChange={(e) => onToggleBatchOperations(e.target.checked)} className="h-5 w-5 accent-[#1f1f1f]"/>
        </label>

        {!isAdmin && (<p className="text-sm text-[#f6a94c] mt-3">Only administrators can change this setting.</p>)}
      </div>

      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#1f1f1f]"/>
          <h3 className="font-semibold text-[#1f1f1f]">Branch Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Branch name"
            value={branchForm.name}
            disabled={!isAdmin || addingBranch}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            placeholder="Location (optional)"
            value={branchForm.location}
            disabled={!isAdmin || addingBranch}
            onChange={(event) => setBranchForm((prev) => ({ ...prev, location: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleAddBranch}
            disabled={!isAdmin || addingBranch || branchForm.name.trim().length < 2}
            className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90"
          >
            {addingBranch ? 'Adding...' : 'Add Branch'}
          </Button>
        </div>

        {!isAdmin && (<p className="text-sm text-[#f6a94c] mt-3">Only administrators can add branches.</p>)}
      </div>

      {isAdmin && (<div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#1f1f1f]"/>
          <h3 className="font-semibold text-[#1f1f1f]">Branch Performance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f3f3]">
                <th className="text-left py-2 pr-4 text-[#828282] font-medium">Branch</th>
                <th className="text-left py-2 pr-4 text-[#828282] font-medium">Operators</th>
                <th className="text-left py-2 pr-4 text-[#828282] font-medium">SIM Sold</th>
                <th className="text-left py-2 pr-4 text-[#828282] font-medium">Revenue</th>
                <th className="text-left py-2 text-[#828282] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#828282]">No branch performance data available</td>
                </tr>
              ) : (
                branchPerformance.map((item) => (
                  <tr key={item.branchName} className="border-b border-[#f9f9f9] last:border-0">
                    <td className="py-2 pr-4 text-[#1f1f1f] font-medium">{item.branchName}</td>
                    <td className="py-2 pr-4 text-[#1f1f1f]">{item.operators}</td>
                    <td className="py-2 pr-4 text-[#1f1f1f]">{item.simSold}</td>
                    <td className="py-2 pr-4 text-[#1f1f1f]">${item.revenue.toFixed(2)}</td>
                    <td className="py-2 text-[#1f1f1f]">{item.actions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>)}
    </div>);
}
