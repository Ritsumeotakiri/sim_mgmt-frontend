import { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Clock3, CreditCard, Mail, Phone, Search, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import { SellSIMModal } from '@/views/components/sim/SellSIMModal';
import { TransactionsTable } from '@/views/components/transaction/TransactionsTable';
import { PlansManagement } from '@/views/components/plan/PlansManagement';
import { BackButton } from '@/views/components/common/BackButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const normalizeSearchValue = (value) => String(value || '').toLowerCase().trim();
const TAB_ORDER_STORAGE_KEY = 'operator-dashboard-tab-order-v1';
const DEFAULT_TAB_ORDER = ['frontdesk', 'sims', 'transactions', 'performance', 'plans'];

const isValidTabOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_TAB_ORDER.length
  && DEFAULT_TAB_ORDER.every((tab) => value.includes(tab));

const computeBestMatchScore = (query, candidate) => {
  const normalizedQuery = normalizeSearchValue(query);
  const normalizedCandidate = normalizeSearchValue(candidate);

  if (!normalizedQuery) {
    return 0;
  }
  if (!normalizedCandidate) {
    return -1;
  }
  if (normalizedCandidate === normalizedQuery) {
    return 120;
  }
  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return 90;
  }
  if (normalizedCandidate.includes(` ${normalizedQuery}`)) {
    return 70;
  }
  if (normalizedCandidate.includes(normalizedQuery)) {
    return 50;
  }
  return -1;
};

export function OperatorDashboard({ sims, msisdns, customers, plans, transactions, onSellSIM, onAddCustomer }) {
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
  const [selectedCustomerSim, setSelectedCustomerSim] = useState(null);
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(TAB_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_TAB_ORDER;
      }
      const parsed = JSON.parse(raw);
      return isValidTabOrder(parsed) ? parsed : DEFAULT_TAB_ORDER;
    }
    catch {
      return DEFAULT_TAB_ORDER;
    }
  });
  const [draggedTab, setDraggedTab] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', idNumber: '', address: '' });

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
      try {
        window.localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(tabOrder));
      }
      catch {
        // ignore storage errors
      }
    }, [tabOrder]);

    // Get available MSISDNs
    const availableMSISDNs = useMemo(() => {
        return msisdns.filter(m => m.status === 'available');
    }, [msisdns]);
    const handleCompleteSale = async (saleData) => {
        const success = await onSellSIM(saleData);
        if (success) {
            setIsSellModalOpen(false);
            setSellingSIM(null);
        }
        return Boolean(success);
    };

    const canAddCustomer = typeof onAddCustomer === 'function';

    const customerInsights = useMemo(() => {
      return customers.map((customer) => {
        const customerTransactions = transactions
          .filter((transaction) => transaction.customerId === customer.id || transaction.customerName === customer.name)
          .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());

        const customerSims = sims.filter((sim) => sim.customerId === customer.id || sim.assignedTo === customer.name);
        const activeSims = customerSims.filter((sim) => String(sim.status || '').toLowerCase() === 'active');
        const lastActivity = customerTransactions[0]?.date || customer.createdAt;

        return {
          customer,
          customerTransactions,
          customerSims,
          activeSims,
          lastActivity,
        };
      });
    }, [customers, sims, transactions]);

    const filteredCustomerInsights = useMemo(() => {
      const keyword = normalizeSearchValue(frontDeskSearch);
      const hasActivityFilters = frontDeskFilters.withTransactions || frontDeskFilters.noTransactions;
      const hasSimFilters = frontDeskFilters.withActiveSim || frontDeskFilters.noActiveSim;

      return customerInsights
        .map((entry) => {
          const candidateScores = [entry.customer.name, entry.customer.email, entry.customer.phone, entry.customer.idNumber]
            .map((value) => computeBestMatchScore(keyword, value));
          const bestScore = Math.max(...candidateScores, -1);

          return {
            ...entry,
            bestMatchScore: keyword ? bestScore : 0,
          };
        })
        .filter(({ customerTransactions, activeSims, bestMatchScore }) => {
          const textMatches = keyword.length === 0 || bestMatchScore >= 0;

          const activityMatches = !hasActivityFilters
            || (frontDeskFilters.withTransactions && customerTransactions.length > 0)
            || (frontDeskFilters.noTransactions && customerTransactions.length === 0);

          const simMatches = !hasSimFilters
            || (frontDeskFilters.withActiveSim && activeSims.length > 0)
            || (frontDeskFilters.noActiveSim && activeSims.length === 0);

          return textMatches && activityMatches && simMatches;
        })
        .sort((first, second) => {
          if (keyword.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
            return second.bestMatchScore - first.bestMatchScore;
          }
          return new Date(second.lastActivity).getTime() - new Date(first.lastActivity).getTime();
        });
    }, [customerInsights, frontDeskFilters, frontDeskSearch]);

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
        ...customerTransactions.map((transaction) => ({
          id: `tx-${transaction.id}`,
          label: `${String(transaction.type || 'transaction').replace(/_/g, ' ')} (${transaction.status})`,
          date: transaction.date,
        })),
      ]
        .filter((entry) => Boolean(entry.date))
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
    }, [selectedCustomerInsight]);

    const handleCreateCustomer = async () => {
      if (!canAddCustomer || isAddingCustomer) {
        return;
      }

      const requiredFields = [newCustomerForm.name, newCustomerForm.email, newCustomerForm.phone, newCustomerForm.idNumber];
      if (requiredFields.some((value) => !String(value || '').trim())) {
        toast.error('Please fill name, email, phone, and ID number');
        return;
      }

      try {
        setIsAddingCustomer(true);
        const success = await onAddCustomer({
          name: newCustomerForm.name.trim(),
          email: newCustomerForm.email.trim(),
          phone: newCustomerForm.phone.trim(),
          idNumber: newCustomerForm.idNumber.trim(),
          address: newCustomerForm.address.trim(),
        });

        if (success !== false) {
          toast.success('Customer registered successfully');
          setIsAddCustomerOpen(false);
          setNewCustomerForm({ name: '', email: '', phone: '', idNumber: '', address: '' });
          setActiveTab('frontdesk');
        }
      }
      finally {
        setIsAddingCustomer(false);
      }
    };

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

    const inactiveSIMs = useMemo(() => sims.filter((item) => String(item.status || '').toLowerCase() === 'inactive'), [sims]);

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

      return transactions
        .filter((transaction) => transaction.simId === selectedCustomerSim.id || transaction.iccid === selectedCustomerSim.iccid)
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
    }, [selectedCustomerSim, transactions]);

    const performanceMetrics = useMemo(() => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const allTransactions = Array.isArray(transactions) ? transactions : [];
      const withValidDate = allTransactions.filter((transaction) => !Number.isNaN(new Date(transaction.date).getTime()));

      const completedStatuses = ['completed', 'success', 'successful'];
      const pendingStatuses = ['pending', 'processing', 'in_progress'];
      const failedStatuses = ['failed', 'rejected', 'cancelled', 'canceled', 'error'];

      const totalTransactions = allTransactions.length;
      const completedTransactions = allTransactions.filter((transaction) => completedStatuses.includes(String(transaction.status || '').toLowerCase())).length;
      const pendingTransactions = allTransactions.filter((transaction) => pendingStatuses.includes(String(transaction.status || '').toLowerCase())).length;
      const failedTransactions = allTransactions.filter((transaction) => failedStatuses.includes(String(transaction.status || '').toLowerCase())).length;

      const todayTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= startOfToday).length;
      const weeklyTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= sevenDaysAgo).length;
      const monthlyTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= startOfMonth).length;

      const monthlyCustomers = (Array.isArray(customers) ? customers : []).filter((customer) => {
        const createdAt = new Date(customer.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfMonth;
      }).length;

      const activeSimsCount = (Array.isArray(sims) ? sims : []).filter((sim) => String(sim.status || '').toLowerCase() === 'active').length;

      const completionRate = totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0;

      const typeCounts = allTransactions.reduce((accumulator, transaction) => {
        const key = String(transaction.type || 'other').toLowerCase();
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {});

      const topTypes = Object.entries(typeCounts)
        .sort((first, second) => second[1] - first[1])
        .slice(0, 3)
        .map(([type, count]) => ({
          type: type.replace(/_/g, ' '),
          count,
        }));

      const recentTransactions = [...withValidDate]
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
        .slice(0, 5);

      const dailyTrend = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(now);
        day.setDate(now.getDate() - (6 - index));
        day.setHours(0, 0, 0, 0);

        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);

        const dayTransactions = withValidDate.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= day && transactionDate < nextDay;
        });

        const dayCompleted = dayTransactions.filter((transaction) => completedStatuses.includes(String(transaction.status || '').toLowerCase())).length;

        return {
          day: `${day.getMonth() + 1}/${day.getDate()}`,
          total: dayTransactions.length,
          completed: dayCompleted,
        };
      });

      return {
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
        todayTransactions,
        weeklyTransactions,
        monthlyTransactions,
        monthlyCustomers,
        activeSimsCount,
        completionRate,
        topTypes,
        recentTransactions,
        dailyTrend,
      };
    }, [customers, sims, transactions]);

      const FRONTDESK_PAGE_SIZE = 6;
      const NUMBER_POOL_PAGE_SIZE = 9;
      const CUSTOMER_SIMS_PAGE_SIZE = 5;
      const TIMELINE_PAGE_SIZE = 5;
      const SIM_TX_PAGE_SIZE = 5;

      const frontDeskTotalPages = Math.max(1, Math.ceil(filteredCustomerInsights.length / FRONTDESK_PAGE_SIZE));
      const safeFrontDeskPage = Math.min(frontDeskPage, frontDeskTotalPages);
      const frontDeskStartIndex = (safeFrontDeskPage - 1) * FRONTDESK_PAGE_SIZE;
      const paginatedFrontDeskCustomers = filteredCustomerInsights.slice(frontDeskStartIndex, frontDeskStartIndex + FRONTDESK_PAGE_SIZE);

      const numberPoolTotalPages = Math.max(1, Math.ceil(sellableNumberPool.length / NUMBER_POOL_PAGE_SIZE));
      const safeNumberPoolPage = Math.min(numberPoolPage, numberPoolTotalPages);
      const numberPoolStartIndex = (safeNumberPoolPage - 1) * NUMBER_POOL_PAGE_SIZE;
      const paginatedNumberPool = sellableNumberPool.slice(numberPoolStartIndex, numberPoolStartIndex + NUMBER_POOL_PAGE_SIZE);

      const selectedCustomerSims = selectedCustomerInsight?.customerSims || [];
      const customerSimsTotalPages = Math.max(1, Math.ceil(selectedCustomerSims.length / CUSTOMER_SIMS_PAGE_SIZE));
      const safeCustomerSimsPage = Math.min(customerSimsPage, customerSimsTotalPages);
      const customerSimsStartIndex = (safeCustomerSimsPage - 1) * CUSTOMER_SIMS_PAGE_SIZE;
      const paginatedCustomerSims = selectedCustomerSims.slice(customerSimsStartIndex, customerSimsStartIndex + CUSTOMER_SIMS_PAGE_SIZE);

      const timelineTotalPages = Math.max(1, Math.ceil(selectedCustomerTimeline.length / TIMELINE_PAGE_SIZE));
      const safeTimelinePage = Math.min(timelinePage, timelineTotalPages);
      const timelineStartIndex = (safeTimelinePage - 1) * TIMELINE_PAGE_SIZE;
      const paginatedTimeline = selectedCustomerTimeline.slice(timelineStartIndex, timelineStartIndex + TIMELINE_PAGE_SIZE);

      const simTxTotalPages = Math.max(1, Math.ceil(selectedSimTransactions.length / SIM_TX_PAGE_SIZE));
      const safeSimTxPage = Math.min(simTxPage, simTxTotalPages);
      const simTxStartIndex = (safeSimTxPage - 1) * SIM_TX_PAGE_SIZE;
      const paginatedSimTransactions = selectedSimTransactions.slice(simTxStartIndex, simTxStartIndex + SIM_TX_PAGE_SIZE);

    const formatDateTime = (value) => {
      if (!value) {
        return 'N/A';
      }
      return new Date(value).toLocaleString();
    };

    const formatNumberDisplay = (value) => String(value || '').replace(/^\+855\s?/, '');

    const tabLabels = {
      frontdesk: 'Front Desk',
      sims: 'SIM Cards',
      transactions: 'Transactions',
      performance: 'My Performance',
      plans: 'Plans',
    };

    const onDropTab = (targetTabKey) => {
      if (!draggedTab || draggedTab === targetTabKey) {
        setDraggedTab(null);
        return;
      }

      setTabOrder((previous) => {
        const next = [...previous];
        const fromIndex = next.indexOf(draggedTab);
        const toIndex = next.indexOf(targetTabKey);

        if (fromIndex === -1 || toIndex === -1) {
          return previous;
        }

        next.splice(fromIndex, 1);
        next.splice(toIndex, 0, draggedTab);
        return next;
      });

      setDraggedTab(null);
    };

    return (<div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
        <div className="border-b border-[#f3f3f3]">
          <div className="flex">
            {tabOrder.map((tabKey) => (<button key={tabKey} draggable onDragStart={() => setDraggedTab(tabKey)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDropTab(tabKey)} onDragEnd={() => setDraggedTab(null)} onClick={() => setActiveTab(tabKey)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-move ${activeTab === tabKey
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'} ${draggedTab === tabKey ? 'opacity-70' : ''}`}>
                {tabLabels[tabKey] || tabKey}
              </button>))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'frontdesk' && (<div className="space-y-5">
              <div className="bg-[#f9f9f9] rounded-xl border border-[#f3f3f3] p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                  <div className="relative lg:col-span-3">
                    <Search className="w-4 h-4 text-[#828282] absolute left-3 top-1/2 -translate-y-1/2"/>
                    <Input value={frontDeskSearch} onChange={(event) => setFrontDeskSearch(event.target.value)} placeholder="Search by name, phone, email, ID number" className="pl-9"/>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-between w-auto min-w-[120px] h-8 px-3 text-xs justify-self-end">
                        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs">Activity</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem className="text-xs" checked={frontDeskFilters.withTransactions} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleFrontDeskFilter('withTransactions')}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                          <span>With transactions</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked={frontDeskFilters.noTransactions} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleFrontDeskFilter('noTransactions')}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                          <span>No transactions</span>
                        </div>
                      </DropdownMenuCheckboxItem>

                      <DropdownMenuSeparator/>
                      <DropdownMenuLabel className="text-xs">SIM state</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem className="text-xs" checked={frontDeskFilters.withActiveSim} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleFrontDeskFilter('withActiveSim')}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                          <span>With active SIM</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="text-xs" checked={frontDeskFilters.noActiveSim} onSelect={(event) => event.preventDefault()} onCheckedChange={() => toggleFrontDeskFilter('noActiveSim')}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                          <span>No active SIM</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                  <p className="text-sm text-[#828282]">{filteredCustomerInsights.length} customer(s) found</p>
                  {canAddCustomer && (<Button onClick={() => setIsAddCustomerOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                      <UserPlus className="w-4 h-4 mr-2"/>
                      Register New Customer
                    </Button>)}
                </div>
              </div>

              <div className="border border-[#f3f3f3] rounded-xl bg-white p-4">
                {filteredCustomerInsights.length === 0 ? (<div className="text-sm text-[#828282] py-12 text-center">No customer matches your search.</div>) : (<div className="space-y-2">
                    {paginatedFrontDeskCustomers.map(({ customer, customerTransactions, activeSims }) => (<button key={customer.id} type="button" onClick={() => openCustomerPage(customer.id)} className="w-full text-left rounded-lg border border-[#f3f3f3] p-3 hover:border-[#c9c7c7] hover:bg-[#fafafa] transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[#1f1f1f]">{customer.name}</p>
                            <p className="text-xs text-[#828282]">{customer.email || 'No email'} • {customer.phone || 'No phone'}</p>
                            <p className="text-xs text-[#828282]">ID: {customer.idNumber || 'N/A'}</p>
                          </div>
                          <div className="text-right text-xs text-[#828282]">
                            <p>{customerTransactions.length} transaction(s)</p>
                            <p>{activeSims.length} active SIM(s)</p>
                          </div>
                        </div>
                      </button>))}
                    {filteredCustomerInsights.length > FRONTDESK_PAGE_SIZE && (<div className="flex items-center justify-between gap-2 pt-2">
                        <p className="text-xs text-[#828282]">Page {safeFrontDeskPage} of {frontDeskTotalPages}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.max(1, previous - 1))} disabled={safeFrontDeskPage <= 1}>
                            <ChevronLeft className="w-4 h-4"/>
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.min(frontDeskTotalPages, previous + 1))} disabled={safeFrontDeskPage >= frontDeskTotalPages}>
                            <ChevronRight className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>)}
                  </div>)}
              </div>
            </div>)}

          {activeTab === 'customer-profile' && (<div className="space-y-5">
              {!selectedCustomerInsight ? (<div className="border border-[#f3f3f3] rounded-xl bg-white p-6 text-sm text-[#828282] text-center">Customer profile not found.</div>) : (<>
                  <div className="flex items-center justify-between">
                    <BackButton onClick={() => setActiveTab('frontdesk')} label="Back to Search"/>
                  </div>

                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
                      <div className="h-28 border-b border-[#f1f1f1] bg-[#fafafa]" />
                      <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
                        <div className="-mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-white text-2xl font-semibold text-[#1f1f1f] shadow-sm">
                              {String(selectedCustomerInsight.customer.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-3 pt-10 sm:pt-9">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#828282]">Customer Profile</p>
                                <h3 className="text-2xl font-semibold leading-tight text-[#1f1f1f]">{selectedCustomerInsight.customer.name}</h3>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-[#5f5f5f]">
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                                  <Mail className="h-4 w-4 text-[#828282]"/>
                                  {selectedCustomerInsight.customer.email || 'No email'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                                  <Phone className="h-4 w-4 text-[#828282]"/>
                                  {selectedCustomerInsight.customer.phone || 'No phone'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                                  <ShieldCheck className="h-4 w-4 text-[#828282]"/>
                                  ID {selectedCustomerInsight.customer.idNumber || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button size="sm" className="h-10 rounded-xl px-4 bg-[#3ebb7f] hover:bg-[#3ebb7f]/90 text-white shadow-sm lg:self-center" onClick={() => {
                            setSellingSIM({
                              customerBuyFlow: true,
                              lockedCustomer: selectedCustomerInsight.customer,
                            });
                            setIsSellModalOpen(true);
                          }}>
                            <Smartphone className="mr-2 h-4 w-4"/>
                            Buy SIM
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b93ff]/10 text-[#5b93ff]">
                          <CreditCard className="h-5 w-5"/>
                        </div>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Transactions</p>
                        <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{selectedCustomerInsight.customerTransactions.length}</p>
                        <p className="mt-1 text-sm text-[#828282]">All purchase and service actions</p>
                      </div>
                      <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6a94c]/10 text-[#f6a94c]">
                          <Smartphone className="h-5 w-5"/>
                        </div>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Total SIMs</p>
                        <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{selectedCustomerInsight.customerSims.length}</p>
                        <p className="mt-1 text-sm text-[#828282]">Numbers linked to this customer</p>
                      </div>
                      <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3ebb7f]/10 text-[#3ebb7f]">
                          <Activity className="h-5 w-5"/>
                        </div>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Active SIMs</p>
                        <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{selectedCustomerInsight.activeSims.length}</p>
                        <p className="mt-1 text-sm text-[#828282]">Currently live services</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-[#1f1f1f]">Customer SIMs</h4>
                            <p className="text-sm text-[#828282]">Tap a SIM card to view full details and activity.</p>
                          </div>
                          <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#5f5f5f]">
                            {selectedCustomerSims.length} total
                          </span>
                        </div>
                        {selectedCustomerSims.length === 0 ? (<div className="rounded-xl border border-dashed border-[#dcdcdc] bg-[#fafafa] p-6 text-center text-sm text-[#828282]">No SIMs assigned yet.</div>) : (<div className="space-y-3">
                            {paginatedCustomerSims.map((sim) => {
                              const planName = plans.find((plan) => plan.id === sim.planId)?.name || (sim.planId ? `Plan #${sim.planId}` : 'No plan');
                              const isActive = sim.status === 'active';
                              return (<button key={sim.id} type="button" onClick={() => {
                                  setSelectedCustomerSim(sim);
                                  setActiveTab('sim-profile');
                                }} className="w-full rounded-2xl border border-[#ededed] bg-gradient-to-br from-white to-[#fafafa] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#d8d8d8] hover:shadow-md">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-semibold text-[#1f1f1f]">{sim.msisdn || 'No MSISDN'}</p>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${isActive ? 'bg-[#3ebb7f]/10 text-[#2f9f67]' : 'bg-[#f3f3f3] text-[#6f6f6f]'}`}>
                                          {sim.status || 'unknown'}
                                        </span>
                                      </div>
                                      <div className="grid gap-1 text-sm text-[#6f6f6f] sm:grid-cols-2">
                                        <p>SIM #{sim.id}</p>
                                        <p className="truncate">ICCID: {sim.iccid || 'N/A'}</p>
                                        <p className="truncate sm:col-span-2">Plan: {planName}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-xl bg-[#f5f5f5] px-3 py-2 text-xs font-medium text-[#5f5f5f]">
                                      View
                                    </div>
                                  </div>
                                </button>);
                            })}
                            {selectedCustomerSims.length > CUSTOMER_SIMS_PAGE_SIZE && (<div className="flex items-center justify-between gap-2 border-t border-[#f3f3f3] pt-3">
                                <p className="text-xs text-[#828282]">Page {safeCustomerSimsPage} of {customerSimsTotalPages}</p>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setCustomerSimsPage((previous) => Math.max(1, previous - 1))} disabled={safeCustomerSimsPage <= 1}>
                                    <ChevronLeft className="w-4 h-4"/>
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setCustomerSimsPage((previous) => Math.min(customerSimsTotalPages, previous + 1))} disabled={safeCustomerSimsPage >= customerSimsTotalPages}>
                                    <ChevronRight className="w-4 h-4"/>
                                  </Button>
                                </div>
                              </div>)}
                          </div>)}
                      </div>

                      <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-4">
                          <h4 className="text-base font-semibold text-[#1f1f1f]">Timeline</h4>
                          <p className="text-sm text-[#828282]">A recent view of customer lifecycle events.</p>
                        </div>
                        {selectedCustomerTimeline.length === 0 ? (<div className="rounded-xl border border-dashed border-[#dcdcdc] bg-[#fafafa] p-6 text-center text-sm text-[#828282]">No history yet.</div>) : (<div className="space-y-3">
                            {paginatedTimeline.map((entry, index) => (<div key={entry.id} className="relative flex items-start gap-3 rounded-2xl border border-[#f1f1f1] bg-[#fcfcfc] p-3.5">
                                <div className="relative flex flex-col items-center">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f]/6 text-[#1f1f1f]">
                                    <Clock3 className="h-4 w-4"/>
                                  </div>
                                  {index < paginatedTimeline.length - 1 && <div className="mt-2 h-8 w-px bg-[#e8e8e8]" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-[#1f1f1f]">{entry.label}</p>
                                  <p className="mt-1 text-xs text-[#828282]">{formatDateTime(entry.date)}</p>
                                </div>
                              </div>))}
                            {selectedCustomerTimeline.length > TIMELINE_PAGE_SIZE && (<div className="flex items-center justify-between gap-2 border-t border-[#f3f3f3] pt-3">
                                <p className="text-xs text-[#828282]">Page {safeTimelinePage} of {timelineTotalPages}</p>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setTimelinePage((previous) => Math.max(1, previous - 1))} disabled={safeTimelinePage <= 1}>
                                    <ChevronLeft className="w-4 h-4"/>
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setTimelinePage((previous) => Math.min(timelineTotalPages, previous + 1))} disabled={safeTimelinePage >= timelineTotalPages}>
                                    <ChevronRight className="w-4 h-4"/>
                                  </Button>
                                </div>
                              </div>)}
                          </div>)}
                      </div>
                    </div>
                  </div>
                </>)}
            </div>)}

          {activeTab === 'sim-profile' && (<div className="space-y-5">
              {!selectedCustomerSim ? (<div className="border border-[#f3f3f3] rounded-xl bg-white p-6 text-sm text-[#828282] text-center">SIM profile not found.</div>) : (<>
                  <div className="flex items-center justify-between">
                    <BackButton onClick={() => setActiveTab('customer-profile')} label="Back to Customer"/>
                  </div>

                  <div className="border border-[#f3f3f3] rounded-xl bg-white p-4 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'No MSISDN'} • SIM #{selectedCustomerSim.id}</h3>
                      <p className="text-sm text-[#828282]">ICCID: {selectedCustomerSim.iccid || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
                        <p className="text-xs text-[#828282]">MSISDN</p>
                        <p className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
                        <p className="text-xs text-[#828282]">Status</p>
                        <p className="text-base font-semibold text-[#1f1f1f] capitalize">{selectedCustomerSim.status || 'unknown'}</p>
                      </div>
                      <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
                        <p className="text-xs text-[#828282]">Plan</p>
                        <p className="text-base font-semibold text-[#1f1f1f]">{plans.find((plan) => plan.id === selectedCustomerSim.planId)?.name || (selectedCustomerSim.planId ? `Plan #${selectedCustomerSim.planId}` : 'No plan')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
                        <p className="text-xs text-[#828282]">Owner</p>
                        <p className="text-sm text-[#1f1f1f]">{selectedCustomerInsight?.customer?.name || selectedCustomerSim.assignedTo || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
                        <p className="text-xs text-[#828282]">Created</p>
                        <p className="text-sm text-[#1f1f1f]">{formatDateTime(selectedCustomerSim.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">SIM Transactions</h4>
                      {selectedSimTransactions.length === 0 ? (<p className="text-sm text-[#828282]">No transactions found for this SIM.</p>) : (<div className="space-y-2">
                          {paginatedSimTransactions.map((transaction) => (<div key={`sim-tx-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')} ({transaction.status || 'unknown'})</p>
                                <p className="text-xs text-[#828282]">{formatDateTime(transaction.date)}</p>
                              </div>
                              <p className="text-xs text-[#828282] mt-1">By: {transaction.userName || 'System'}</p>
                            </div>))}
                          {selectedSimTransactions.length > SIM_TX_PAGE_SIZE && (<div className="flex items-center justify-between gap-2 pt-1">
                              <p className="text-xs text-[#828282]">Page {safeSimTxPage} of {simTxTotalPages}</p>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.max(1, previous - 1))} disabled={safeSimTxPage <= 1}>
                                  <ChevronLeft className="w-4 h-4"/>
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.min(simTxTotalPages, previous + 1))} disabled={safeSimTxPage >= simTxTotalPages}>
                                  <ChevronRight className="w-4 h-4"/>
                                </Button>
                              </div>
                            </div>)}
                        </div>)}
                    </div>
                  </div>
                </>)}
            </div>)}

          {activeTab === 'sims' && (<div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1f1f1f]">Number Pool (Sell by Number)</h3>
                  <p className="text-sm text-[#828282]">Pick a number first, then choose ICCID in the sale popup.</p>
                </div>
                <div className="w-full max-w-sm">
                  <Input value={numberPoolSearch} onChange={(event) => setNumberPoolSearch(event.target.value)} placeholder="Search number..."/>
                </div>
              </div>

                {sellableNumberPool.length === 0 ? (<div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-6 text-sm text-[#828282] text-center">No available numbers found.</div>) : (<div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {paginatedNumberPool.map((entry) => (<div key={entry.id} className="rounded-lg border border-[#f3f3f3] p-4 bg-white hover:border-[#c9c7c7] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#1f1f1f] mb-1">{formatNumberDisplay(entry.number)}</p>
                          <p className="text-xs text-[#828282]">Available</p>
                        </div>
                        <p className="text-xl font-bold text-[#1f1f1f] leading-none">${Number(entry.price || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button size="sm" onClick={() => {
                      setSellingSIM({ preselectedMSISDN: entry });
                      setIsSellModalOpen(true);
                      }} className="h-8 px-4 bg-[#3ebb7f] hover:bg-[#3ebb7f]/90 text-white">Sell</Button>
                      </div>
                    </div>))}
                    </div>
                    {sellableNumberPool.length > NUMBER_POOL_PAGE_SIZE && (<div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#828282]">Page {safeNumberPoolPage} of {numberPoolTotalPages}</p>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setNumberPoolPage((previous) => Math.max(1, previous - 1))} disabled={safeNumberPoolPage <= 1}>
                            <ChevronLeft className="w-4 h-4"/>
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setNumberPoolPage((previous) => Math.min(numberPoolTotalPages, previous + 1))} disabled={safeNumberPoolPage >= numberPoolTotalPages}>
                            <ChevronRight className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>)}
                  </div>)}
            </div>)}

          {activeTab === 'transactions' && (<TransactionsTable useServerPagination={true}/>)}

          {activeTab === 'performance' && (<div className="space-y-4">
              <div className="border border-[#f3f3f3] rounded-xl bg-white p-4">
                <h3 className="text-base font-semibold text-[#1f1f1f]">My Performance</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-xs text-[#828282]">Transactions Today</p>
                  <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.todayTransactions}</p>
                </div>
                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-xs text-[#828282]">Transactions (7 days)</p>
                  <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.weeklyTransactions}</p>
                </div>
                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-xs text-[#828282]">Transactions (Month)</p>
                  <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.monthlyTransactions}</p>
                </div>
                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-xs text-[#828282]">Success Rate</p>
                  <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.completionRate}%</p>
                </div>
              </div>

              <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">7-Day Transaction Trend</p>
                <div className="h-64 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceMetrics.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3"/>
                      <XAxis dataKey="day" tick={{ fill: '#828282', fontSize: 12 }} axisLine={{ stroke: '#f3f3f3' }} tickLine={false}/>
                      <YAxis allowDecimals={false} tick={{ fill: '#828282', fontSize: 12 }} axisLine={{ stroke: '#f3f3f3' }} tickLine={false}/>
                      <Tooltip/>
                      <Legend/>
                      <Bar dataKey="total" name="Total" fill="#5b93ff" radius={[4, 4, 0, 0]}/>
                      <Bar dataKey="completed" name="Completed" fill="#3ebb7f" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f1f1f]">Status Breakdown</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#828282]">Completed</span>
                      <span className="text-[#1f1f1f] font-medium">{performanceMetrics.completedTransactions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#828282]">Pending</span>
                      <span className="text-[#1f1f1f] font-medium">{performanceMetrics.pendingTransactions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#828282]">Failed</span>
                      <span className="text-[#1f1f1f] font-medium">{performanceMetrics.failedTransactions}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#f3f3f3]">
                      <span className="text-[#828282]">Total</span>
                      <span className="text-[#1f1f1f] font-semibold">{performanceMetrics.totalTransactions}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f1f1f]">Operational Snapshot</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#828282]">Active SIMs</span>
                      <span className="text-[#1f1f1f] font-medium">{performanceMetrics.activeSimsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#828282]">New Customers (Month)</span>
                      <span className="text-[#1f1f1f] font-medium">{performanceMetrics.monthlyCustomers}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f1f1f]">Top Transaction Types</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {performanceMetrics.topTypes.length === 0 ? (<p className="text-[#828282]">No transactions yet.</p>) : performanceMetrics.topTypes.map((item) => (<div key={item.type} className="flex items-center justify-between">
                          <span className="text-[#828282] capitalize">{item.type}</span>
                          <span className="text-[#1f1f1f] font-medium">{item.count}</span>
                        </div>))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f1f1f]">Recent Transactions</p>
                {performanceMetrics.recentTransactions.length === 0 ? (<p className="text-sm text-[#828282] mt-2">No recent transactions.</p>) : (<div className="mt-3 space-y-2">
                    {performanceMetrics.recentTransactions.map((transaction) => (<div key={`perf-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')} ({transaction.status || 'unknown'})</p>
                          <p className="text-xs text-[#828282]">{formatDateTime(transaction.date)}</p>
                        </div>
                        <p className="text-xs text-[#828282] mt-1">Customer: {transaction.customerName || 'N/A'} • SIM: {transaction.iccid || 'N/A'}</p>
                      </div>))}
                  </div>)}
              </div>
            </div>)}

          {activeTab === 'plans' && (<PlansManagement plans={plans} canEdit={false}/>)}
        </div>
      </div>

      {/* Sell SIM Modal */}
      <SellSIMModal isOpen={isSellModalOpen} onClose={() => {
            setIsSellModalOpen(false);
            setSellingSIM(null);
        }} onSell={handleCompleteSale} sim={sellingSIM && !sellingSIM.preselectedMSISDN && !sellingSIM.customerBuyFlow ? sellingSIM : null} preselectedMSISDN={sellingSIM?.preselectedMSISDN || null} lockedCustomer={sellingSIM?.lockedCustomer || null} availableSIMs={inactiveSIMs} availableMSISDNs={availableMSISDNs} customers={customers} plans={plans}/>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Customer</DialogTitle>
            <DialogDescription>Add customer details for front-desk registration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={newCustomerForm.name} onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Customer full name"/>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newCustomerForm.email} onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="customer@email.com"/>
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={newCustomerForm.phone} onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone number"/>
            </div>
            <div className="space-y-1">
              <Label>ID Number</Label>
              <Input value={newCustomerForm.idNumber} onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, idNumber: event.target.value }))} placeholder="National ID / Passport"/>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={newCustomerForm.address} onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Optional address"/>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)} disabled={isAddingCustomer}>Cancel</Button>
              <Button onClick={handleCreateCustomer} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90" disabled={isAddingCustomer || !canAddCustomer}>
                {isAddingCustomer ? 'Saving...' : 'Register Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
