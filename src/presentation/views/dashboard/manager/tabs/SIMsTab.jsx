import { Button } from '@/presentation/components/ui/button';
import { Plus } from 'lucide-react';
import { SIMTable } from '@/presentation/views/components/sim/SIMTable';
import { toast } from 'sonner';

export function SIMsTab({ sims, handleAddSIM, handleEditSIM }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[#1f1f1f]">All SIM Cards</h3>
      </div>
      <SIMTable sims={sims} userRole="manager" onEdit={handleEditSIM} onDelete={() => toast.error('Managers cannot delete SIMs. Contact an admin.')} />
    </div>
  );
}

export default SIMsTab;
