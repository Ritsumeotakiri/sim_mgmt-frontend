import { SimsTabView } from '@/presentation/views/operator/tabs/SimsTabView';
import { SimProfileTabView } from '@/presentation/views/operator/tabs/SimProfileTabView';
import { CustomerProfileTab } from '@/presentation/views/operator/tabs/CustomerProfileTabView';
import React, { useState } from 'react';

// Wrapper that embeds three operator views inside the manager dashboard.
// Provides safe fallback props and an `actingAs="manager"` context prop so
// operator code can detect manager actions if they read this prop.
export function OperatorEmbeddedTab({ actingAs = 'manager' }) {
  const [numberPoolSearch, setNumberPoolSearch] = useState('');
  const [numberPoolPage, setNumberPoolPage] = useState(1);
  const [paginatedNumberPool, setPaginatedNumberPool] = useState([]);
  const [sellableNumberPool, setSellableNumberPool] = useState([]);
  const [sellingSIM, setSellingSIM] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  const [selectedCustomerSim, setSelectedCustomerSim] = useState(null);
  const [selectedCustomerInsight, setSelectedCustomerInsight] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedSimTransactions, setSelectedSimTransactions] = useState([]);

  // Customer profile props
  const [paginatedCustomerSims, setPaginatedCustomerSims] = useState([]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 border border-[#f3f3f3]">
        <h4 className="font-semibold mb-3">Operator — Number Pool (embedded)</h4>
        <SimsTabView
          sellableNumberPool={sellableNumberPool}
          numberPoolSearch={numberPoolSearch}
          setNumberPoolSearch={setNumberPoolSearch}
          setNumberPoolPage={setNumberPoolPage}
          numberPoolTotalPages={1}
          safeNumberPoolPage={numberPoolPage}
          paginatedNumberPool={paginatedNumberPool}
          setSellingSIM={(payload) => { setSellingSIM(payload); }}
          setIsSellModalOpen={setIsSellModalOpen}
          actingAs={actingAs}
        />
      </div>

      <div className="bg-white rounded-xl p-4 border border-[#f3f3f3]">
        <h4 className="font-semibold mb-3">Operator — SIM Profile (embedded)</h4>
        <SimProfileTabView
          selectedCustomerSim={selectedCustomerSim}
          selectedCustomerInsight={selectedCustomerInsight}
          plans={plans}
          selectedSimTransactions={selectedSimTransactions}
          setSimTxPage={() => {}}
          safeSimTxPage={1}
          setActiveTab={() => {}}
          refreshData={() => {}}
          userId={null}
          branchId={null}
          selectedSimLifecycle={[]}
          isSimLifecycleLoading={false}
          setSellingSIM={(p) => setSellingSIM(p)}
          setIsSellModalOpen={setIsSellModalOpen}
          actingAs={actingAs}
        />
      </div>

      <div className="bg-white rounded-xl p-4 border border-[#f3f3f3]">
        <h4 className="font-semibold mb-3">Operator — Customer Profile (embedded)</h4>
        <CustomerProfileTab
          selectedCustomerInsight={selectedCustomerInsight}
          paginatedCustomerSims={paginatedCustomerSims}
          selectedCustomerTimeline={[]}
          setCustomerSimsPage={() => {}}
          customerSimsTotalPages={1}
          safeCustomerSimsPage={1}
          setTimelinePage={() => {}}
          safeTimelinePage={1}
          plans={plans}
          setSelectedCustomerSim={setSelectedCustomerSim}
          setActiveTab={() => {}}
          setSellingSIM={(p) => setSellingSIM(p)}
          setIsSellModalOpen={setIsSellModalOpen}
          userId={null}
          branchId={null}
          refreshData={() => {}}
          actingAs={actingAs}
        />
      </div>
    </div>
  );
}

export default OperatorEmbeddedTab;
