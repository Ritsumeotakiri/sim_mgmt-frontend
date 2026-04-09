import { MSISDNInventory } from '@/presentation/views/components/msisdn/MSISDNInventory';

export function MSISDNsTab({ msisdns }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#f6a94c]/10 border border-[#f6a94c]/20 rounded-lg p-4">
        <p className="text-sm text-[#f6a94c]">
          <strong>Read-only view:</strong> Only administrators can manage the MSISDN inventory.
        </p>
      </div>
      <MSISDNInventory msisdns={msisdns}/>
    </div>
  );
}

export default MSISDNsTab;
