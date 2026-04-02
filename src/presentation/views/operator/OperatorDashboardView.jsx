import { useEffect, useMemo, useState } from 'react';
import { SellSIMModal } from '@/presentation/views/components/sim/SellSIMModal';
import { TransactionsTable } from '@/presentation/views/components/transaction/TransactionsTable';
import { useTabOrder } from '@/presentation/viewModels/operator/hooks/useTabOrder';
import { useCustomerInsights, useFilteredCustomerInsights } from '@/presentation/viewModels/operator/hooks/useCustomerInsights';
import { usePerformanceMetrics } from '@/presentation/viewModels/operator/hooks/usePerformanceMetrics';
import { TabNavigationView } from '@/presentation/views/operator/components/TabNavigationView';
import { RegisterCustomerDialogView } from '@/presentation/views/operator/components/RegisterCustomerDialogView';
import { FrontDeskTabView } from '@/presentation/views/operator/FrontDeskTabView';
import { SimsTabView } from '@/presentation/views/operator/tabs/SimsTabView';
import { CustomerProfileTab } from '@/presentation/views/operator/tabs/CustomerProfileTabView';
import { SimProfileTabView } from '@/presentation/views/operator/tabs/SimProfileTabView';
import { PerformanceTabView } from '@/presentation/views/operator/tabs/PerformanceTabView';
import { PlansTabView } from '@/presentation/views/operator/tabs/PlansTabView';
import { 
  FRONTDESK_PAGE_SIZE, 
  NUMBER_POOL_PAGE_SIZE, 
  CUSTOMER_SIMS_PAGE_SIZE, 
  TIMELINE_PAGE_SIZE, 
  SIM_TX_PAGE_SIZE 
} from '@/presentation/views/operator/utils/constants';
import { normalizeSearchValue, computeBestMatchScore } from '@/presentation/views/operator/utils/searchUtils';
import { useOperatorActionsViewModel } from '@/presentation/viewModels/useOperatorActionsViewModel';
import { backendApi } from '@/data/services/backendApi';

export function OperatorDashboardView({ 
  sims, 
  msisdns, 
  customers, 
  plans, 
  transactions, 
  onSellSIM, 
  onReactivateSIM,
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
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [localSims, setLocalSims] = useState(sims);
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [selectedCustomerSim, setSelectedCustomerSim] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedSimLifecycle, setSelectedSimLifecycle] = useState([]);
  const [isSimLifecycleLoading, setIsSimLifecycleLoading] = useState(false);

  const { tabOrder, draggedTab, setDraggedTab, onDropTab } = useTabOrder();

  const {
    isRefreshing,
    refreshData,
    handleCompleteSale,
    handleCompleteReactivation,
    handleOpenQuickSale,
    handleQuickTopUp,
    handleQuickChangePlan,
  } = useOperatorActionsViewModel({
    userId,
    branchId,
    localSims,
    onSellSIM,
    onReactivateSIM,
    selectedCustomerSim,
    setSelectedCustomerSim,
    setLocalCustomers,
    setLocalSims,
    setLocalTransactions,
    setIsSellModalOpen,
    setSellingSIM,
  });

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
    let isActive = true;

    const loadLifecycle = async () => {
      if (!selectedCustomerSim?.id) {
        setSelectedSimLifecycle([]);
        return;
      }

      setIsSimLifecycleLoading(true);
      try {
        const events = await backendApi.getSimLifecycleHistory(selectedCustomerSim.id);
        if (isActive) {
          setSelectedSimLifecycle(Array.isArray(events) ? events : []);
        }
      } catch (error) {
        if (isActive) {
          setSelectedSimLifecycle([]);
        }
      } finally {
        if (isActive) {
          setIsSimLifecycleLoading(false);
        }
      }
    };

    loadLifecycle();

    return () => {
      isActive = false;
    };
  }, [selectedCustomerSim?.id, isRefreshing]);

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
    const lifecycleEvents = (selectedCustomerSim?.id ? selectedSimLifecycle : [])
      .filter((event) => Boolean(event?.event_date))
      .map((event, index) => ({
        id: `sim-life-${selectedCustomerSim?.id}-${index}-${event.event_type || 'event'}`,
        label: `SIM ${selectedCustomerSim?.msisdn || selectedCustomerSim?.iccid || selectedCustomerSim?.id}: ${event.summary}${event.details ? ` · ${event.details}` : ''}`,
        date: event.event_date,
      }));

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
      ...lifecycleEvents,
    ]
      .filter((entry) => Boolean(entry.date))
      .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  }, [selectedCustomerInsight, sims, selectedCustomerSim, selectedSimLifecycle]);

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
        <TabNavigationView
          tabOrder={tabOrder}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          draggedTab={draggedTab}
          setDraggedTab={setDraggedTab}
          onDropTab={onDropTab}
        />

        <div className="p-5">
          {activeTab === 'frontdesk' && (
            <FrontDeskTabView
              customers={localCustomers}
              sims={localSims}
              plans={plans}
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
              onOpenSaleAction={handleOpenQuickSale}
              onSubmitTopUpAction={handleQuickTopUp}
              onSubmitChangePlanAction={handleQuickChangePlan}
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
            <SimProfileTabView
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
              refreshData={refreshData}
              userId={userId}
              branchId={branchId}
              selectedSimLifecycle={selectedSimLifecycle}
              isSimLifecycleLoading={isSimLifecycleLoading}
              setSellingSIM={setSellingSIM}
              setIsSellModalOpen={setIsSellModalOpen}
            />
          )}

          {activeTab === 'sims' && (
            <SimsTabView
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
            <PerformanceTabView performanceMetrics={performanceMetrics} />
          )}

          {activeTab === 'plans' && (
            <PlansTabView plans={plans} />
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
        onReactivate={handleCompleteReactivation}
        sim={sellingSIM && !sellingSIM.preselectedMSISDN && !sellingSIM.customerBuyFlow ? sellingSIM : null}
        preselectedMSISDN={sellingSIM?.preselectedMSISDN || null}
        lockedCustomer={sellingSIM?.lockedCustomer || null}
        availableSIMs={inactiveSIMs}
        availableMSISDNs={availableMSISDNs}
        customers={localCustomers}
        plans={plans}
      />

      {/* Register Customer Dialog */}
      <RegisterCustomerDialogView
        isOpen={isAddCustomerOpen}
        setIsOpen={setIsAddCustomerOpen}
        onAddCustomer={onAddCustomer}
      />
    </div>
  );
}
