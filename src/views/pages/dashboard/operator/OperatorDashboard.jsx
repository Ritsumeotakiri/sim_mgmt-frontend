/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SellSIMModal } from '@/views/components/sim/SellSIMModal';
import { TransactionsTable } from '@/views/components/transaction/TransactionsTable';
import { useTabOrder } from './hooks/useTabOrder';
import { useCustomerInsights, useFilteredCustomerInsights } from './hooks/useCustomerInsights';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { TabNavigation } from './components/TabNavigation';
import { RegisterCustomerDialog } from './components/RegisterCustomerDialog';
import { FrontDeskTab } from './tabs/FrontDeskTab';
import { SimsTab } from './tabs/SimsTab';
import { CustomerProfileTab } from './tabs/CustomerProfileTab';
import { SimProfileTab } from './tabs/SimProfileTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { PlansTab } from './tabs/PlansTab';
import { 
  FRONTDESK_PAGE_SIZE, 
  NUMBER_POOL_PAGE_SIZE, 
  CUSTOMER_SIMS_PAGE_SIZE, 
  TIMELINE_PAGE_SIZE, 
  SIM_TX_PAGE_SIZE 
} from './utils/constants';
import { normalizeSearchValue, computeBestMatchScore } from './utils/searchUtils';

export function OperatorDashboard({ 
  sims, 
  msisdns, 
  customers, 
  plans, 
  transactions, 
  onSellSIM, 
  onAddCustomer,
  userId, // Add userId prop
  branchId // Add branchId prop
}) {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingSIM, setSellingSIM] = useState(null);
  const [activeTab, setActiveTab] = useState('frontdesk');
  const [frontDeskSearch, setFrontDeskSearch] = useState('');
  const [numberPoolSearch, setNumberPoolSearch] = useState('');
  const [frontDeskPage, setFrontDeskPage] = useState(1);
  const [numberPoolPage, setNumberPoolPage] = useState(1);
  const [customerSimsPage, setCustomerSimsPage] = useState(1);
  const [timelinePage, setTimelinePage] = useState(1);
  const [simTxPage, setSimTxPage] = useState(1);
  const [frontDeskFilters, setFrontDeskFilters] = useState({
    withTransactions: false,
    noTransactions: false,
    withActiveSim: false,
    noActiveSim: false,
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [localSims, setLocalSims] = useState(sims);
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [selectedCustomerSim, setSelectedCustomerSim] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const { tabOrder, draggedTab, setDraggedTab, onDropTab } = useTabOrder();

  // Add refreshData function
  const refreshData = async (simIdToUpdate = null) => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh; replace with real API calls if needed
      // For now, just use the latest props
      setLocalCustomers(customers);
      setLocalSims(sims);
      setLocalTransactions(transactions);
      // If a SIM was just updated, update selectedCustomerSim to the latest version
      if (simIdToUpdate && selectedCustomerSim) {
        const updatedSim = sims.find(sim => String(sim.id) === String(simIdToUpdate));
        if (updatedSim) {
          setSelectedCustomerSim(updatedSim);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setFrontDeskPage(1);
  }, [frontDeskSearch, frontDeskFilters]);

  useEffect(() => {
    setNumberPoolPage(1);
  }, [numberPoolSearch]);

  useEffect(() => {
    setCustomerSimsPage(1);
    setTimelinePage(1);
  }, [selectedCustomerId]);

  useEffect(() => {
    setSimTxPage(1);
  }, [selectedCustomerSim]);

  useEffect(() => { 
    setLocalCustomers(customers); 
  }, [customers]);
  
  useEffect(() => { 
    setLocalSims(sims); 
  }, [sims]);
  
  useEffect(() => { 
    setLocalTransactions(transactions); 
  }, [transactions]);

  // Get available MSISDNs
  const availableMSISDNs = useMemo(() => {
    return msisdns.filter(m => m.status === 'available');
  }, [msisdns]);

  const inactiveSIMs = useMemo(() => sims.filter((item) => String(item.status || '').toLowerCase() === 'inactive'), [sims]);

  const handleCompleteSale = async (saleData) => {
    const success = await onSellSIM(saleData);
    if (success) {
      setIsSellModalOpen(false);
      setSellingSIM(null);
    }
    return Boolean(success);
  };

  const canAddCustomer = typeof onAddCustomer === 'function';

  const customerInsights = useCustomerInsights(localCustomers, localSims, localTransactions);
  const filteredCustomerInsights = useFilteredCustomerInsights(customerInsights, frontDeskSearch, frontDeskFilters);
  const performanceMetrics = usePerformanceMetrics(localCustomers, localSims, localTransactions);

  const selectedCustomerInsight = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }
    return customerInsights.find((entry) => entry.customer.id === selectedCustomerId) || null;
  }, [customerInsights, selectedCustomerId]);

  const selectedCustomerTimeline = useMemo(() => {
    if (!selectedCustomerInsight) {
      return [];
    }

    const { customer, customerTransactions } = selectedCustomerInsight;
    return [
      {
        id: `customer-${customer.id}`,
        label: 'Customer registered',
        date: customer.createdAt,
      },
      ...customerTransactions.map((transaction) => {
        let label = `${String(transaction.type || 'transaction').replace(/_/g, ' ')} (${transaction.status})`;
        // Add more detail for top up
        if (String(transaction.type).toLowerCase() === 'top_up') {
          // Try to show phone number and amount if available
          let simInfo = '';
          if (transaction.simId) {
            const sim = sims.find(s => String(s.id) === String(transaction.simId));
            if (sim && sim.msisdn) {
              simInfo = ` to ${sim.msisdn}`;
            }
          }
          let amountInfo = '';
          if (transaction.amount) {
            amountInfo = `, Amount: $${Number(transaction.amount).toFixed(2)}`;
          }
          label = `Top Up${simInfo}${amountInfo} (${transaction.status})`;
        }
        return {
          id: `tx-${transaction.id}`,
          label,
          date: transaction.date,
        };
      }),
    ]
      .filter((entry) => Boolean(entry.date))
      .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  }, [selectedCustomerInsight, sims]);

  const activeFilterCount = Object.values(frontDeskFilters).filter(Boolean).length;

  const toggleFrontDeskFilter = (key) => {
    setFrontDeskFilters((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const openCustomerPage = (customerId) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerSim(null);
    setActiveTab('customer-profile');
  };

  const sellableNumberPool = useMemo(() => {
    const keyword = normalizeSearchValue(numberPoolSearch);

    return availableMSISDNs
      .map((entry) => ({
        ...entry,
        bestMatchScore: keyword ? computeBestMatchScore(keyword, entry.number) : 0,
      }))
      .filter((entry) => keyword.length === 0 || entry.bestMatchScore >= 0)
      .sort((first, second) => {
        if (keyword.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
          return second.bestMatchScore - first.bestMatchScore;
        }
        return String(first.number || '').localeCompare(String(second.number || ''));
      });
  }, [availableMSISDNs, numberPoolSearch]);

  const selectedSimTransactions = useMemo(() => {
    if (!selectedCustomerSim) {
      return [];
    }

    return localTransactions
      .filter((transaction) => transaction.simId === selectedCustomerSim.id || transaction.iccid === selectedCustomerSim.iccid)
      .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  }, [selectedCustomerSim, localTransactions]);

  // Pagination calculations
  const frontDeskTotalPages = Math.max(1, Math.ceil(filteredCustomerInsights.length / FRONTDESK_PAGE_SIZE));
  const safeFrontDeskPage = Math.min(frontDeskPage, frontDeskTotalPages);
  
  const numberPoolTotalPages = Math.max(1, Math.ceil(sellableNumberPool.length / NUMBER_POOL_PAGE_SIZE));
  const safeNumberPoolPage = Math.min(numberPoolPage, numberPoolTotalPages);
  
  const selectedCustomerSims = selectedCustomerInsight?.customerSims || [];
  const customerSimsTotalPages = Math.max(1, Math.ceil(selectedCustomerSims.length / CUSTOMER_SIMS_PAGE_SIZE));
  const safeCustomerSimsPage = Math.min(customerSimsPage, customerSimsTotalPages);
  
  const timelineTotalPages = Math.max(1, Math.ceil(selectedCustomerTimeline.length / TIMELINE_PAGE_SIZE));
  const safeTimelinePage = Math.min(timelinePage, timelineTotalPages);
  
  const simTxTotalPages = Math.max(1, Math.ceil(selectedSimTransactions.length / SIM_TX_PAGE_SIZE));
  const safeSimTxPage = Math.min(simTxPage, simTxTotalPages);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
        <TabNavigation
          tabOrder={tabOrder}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          draggedTab={draggedTab}
          setDraggedTab={setDraggedTab}
          onDropTab={onDropTab}
        />

        <div className="p-5">
          {activeTab === 'frontdesk' && (
            <FrontDeskTab
              filteredCustomerInsights={filteredCustomerInsights}
              frontDeskSearch={frontDeskSearch}
              setFrontDeskSearch={setFrontDeskSearch}
              frontDeskFilters={frontDeskFilters}
              toggleFrontDeskFilter={toggleFrontDeskFilter}
              activeFilterCount={activeFilterCount}
              canAddCustomer={canAddCustomer}
              setIsAddCustomerOpen={setIsAddCustomerOpen}
              openCustomerPage={openCustomerPage}
              frontDeskPage={frontDeskPage}
              setFrontDeskPage={setFrontDeskPage}
              frontDeskTotalPages={frontDeskTotalPages}
              safeFrontDeskPage={safeFrontDeskPage}
            />
          )}

          {activeTab === 'customer-profile' && (
            <CustomerProfileTab
              selectedCustomerInsight={selectedCustomerInsight}
              selectedCustomerSims={selectedCustomerSims}
              paginatedCustomerSims={selectedCustomerSims.slice(
                (safeCustomerSimsPage - 1) * CUSTOMER_SIMS_PAGE_SIZE,
                safeCustomerSimsPage * CUSTOMER_SIMS_PAGE_SIZE
              )}
              paginatedTimeline={selectedCustomerTimeline.slice(
                (safeTimelinePage - 1) * TIMELINE_PAGE_SIZE,
                safeTimelinePage * TIMELINE_PAGE_SIZE
              )}
              selectedCustomerTimeline={selectedCustomerTimeline}
              customerSimsPage={customerSimsPage}
              setCustomerSimsPage={setCustomerSimsPage}
              customerSimsTotalPages={customerSimsTotalPages}
              safeCustomerSimsPage={safeCustomerSimsPage}
              timelinePage={timelinePage}
              setTimelinePage={setTimelinePage}
              timelineTotalPages={timelineTotalPages}
              safeTimelinePage={safeTimelinePage}
              plans={plans}
              setSelectedCustomerSim={setSelectedCustomerSim}
              setActiveTab={setActiveTab}
              setSellingSIM={setSellingSIM}
              setIsSellModalOpen={setIsSellModalOpen}
              userId={userId}
              branchId={branchId}
              refreshData={refreshData}
            />
          )}

          {activeTab === 'sim-profile' && (
            <SimProfileTab
              selectedCustomerSim={selectedCustomerSim}
              selectedCustomerInsight={selectedCustomerInsight}
              plans={plans}
              selectedSimTransactions={selectedSimTransactions}
              paginatedSimTransactions={selectedSimTransactions.slice(
                (safeSimTxPage - 1) * SIM_TX_PAGE_SIZE,
                safeSimTxPage * SIM_TX_PAGE_SIZE
              )}
              simTxPage={simTxPage}
              setSimTxPage={setSimTxPage}
              simTxTotalPages={simTxTotalPages}
              safeSimTxPage={safeSimTxPage}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'sims' && (
            <SimsTab
              sellableNumberPool={sellableNumberPool}
              numberPoolSearch={numberPoolSearch}
              setNumberPoolSearch={setNumberPoolSearch}
              setNumberPoolPage={setNumberPoolPage}
              numberPoolTotalPages={numberPoolTotalPages}
              safeNumberPoolPage={safeNumberPoolPage}
              paginatedNumberPool={sellableNumberPool.slice(
                (safeNumberPoolPage - 1) * NUMBER_POOL_PAGE_SIZE,
                safeNumberPoolPage * NUMBER_POOL_PAGE_SIZE
              )}
              setSellingSIM={setSellingSIM}
              setIsSellModalOpen={setIsSellModalOpen}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTable useServerPagination={true} />
          )}

          {activeTab === 'performance' && (
            <PerformanceTab performanceMetrics={performanceMetrics} />
          )}

          {activeTab === 'plans' && (
            <PlansTab plans={plans} />
          )}
        </div>
      </div>

      {/* Sell SIM Modal */}
      <SellSIMModal
        isOpen={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellingSIM(null);
        }}
        onSell={handleCompleteSale}
        sim={sellingSIM && !sellingSIM.preselectedMSISDN && !sellingSIM.customerBuyFlow ? sellingSIM : null}
        preselectedMSISDN={sellingSIM?.preselectedMSISDN || null}
        lockedCustomer={sellingSIM?.lockedCustomer || null}
        availableSIMs={inactiveSIMs}
        availableMSISDNs={availableMSISDNs}
        customers={localCustomers}
        plans={plans}
      />

      {/* Register Customer Dialog */}
      <RegisterCustomerDialog
        isOpen={isAddCustomerOpen}
        setIsOpen={setIsAddCustomerOpen}
        onAddCustomer={onAddCustomer}
      />
    </div>
  );
}