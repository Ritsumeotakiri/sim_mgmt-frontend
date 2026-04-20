import { MSISDNInventory } from '@/presentation/views/components/msisdn/MSISDNInventory';

export function MSISDNsTab({ msisdns }) {
  return (
    <div className="space-y-4">
      <MSISDNInventory msisdns={msisdns}/>
    </div>
  );
}

export default MSISDNsTab;
