import React, { useEffect, useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'sonner';
import { addBalanceToSim, deactivateSim } from '@/data/services/backendApi/sim';
import { BackButton } from '@/presentation/views/components/common/BackButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/presentation/views/operator/utils/dateUtils';
import { Loading } from '@/presentation/components/ui/Loading';
import { StatusBadge } from '@/presentation/views/components/common/StatusBadge';
// Helper to format date with month name
function formatDateWithMonthName(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  return date.toLocaleString(undefined, options);
}
import { SIM_TX_PAGE_SIZE } from '@/presentation/views/operator/utils/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';

export const SimProfileTabView = ({
  selectedCustomerSim,
  selectedCustomerInsight,
  plans,
  selectedSimTransactions,
  setSimTxPage,
  safeSimTxPage,
  setActiveTab,
  refreshData,
  userId,
  branchId,
  selectedSimLifecycle = [],
  isSimLifecycleLoading = false,
  setSellingSIM,
  setIsSellModalOpen,
}) => {
  // Modal state for Top Up
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [simActivityPage, setSimActivityPage] = useState(1);
  const [simTxDateFilter, setSimTxDateFilter] = useState('');
  const [simLifecycleDateFilter, setSimLifecycleDateFilter] = useState('');
  const [simTxFilterMode, setSimTxFilterMode] = useState('today');
  const [simLifecycleFilterMode, setSimLifecycleFilterMode] = useState('today');

  const SIM_ACTIVITY_PAGE_SIZE = 5;
  const getLocalDateString = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayDate = getLocalDateString(new Date());

  const startOfWeek = (dateValue) => {
    const date = new Date(dateValue);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const startOfMonth = (dateValue) => {
    const date = new Date(dateValue);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const resolveDateRange = (mode, customDate) => {
    if (mode === 'all') {
      return { start: null, end: null, single: '' };
    }
    if (mode === 'custom') {
      return { start: null, end: null, single: customDate || todayDate };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (mode === 'week') {
      return { start: startOfWeek(today), end: today, single: '' };
    }
    if (mode === 'month') {
      return { start: startOfMonth(today), end: today, single: '' };
    }
    return { start: today, end: today, single: todayDate };
  };

  const simTxDateRange = resolveDateRange(simTxFilterMode, simTxDateFilter);
  const simLifecycleDateRange = resolveDateRange(simLifecycleFilterMode, simLifecycleDateFilter);

  const matchesDateFilter = (value, range) => {
    if (!range || (!range.single && !range.start && !range.end)) {
      return true;
    }
    if (!value) {
      return false;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }
    parsed.setHours(0, 0, 0, 0);
    if (range.single) {
      return getLocalDateString(parsed) === range.single;
    }
    if (range.start && parsed < range.start) {
      return false;
    }
    if (range.end && parsed > range.end) {
      return false;
    }
    return true;
  };

  const filteredSimTransactions = selectedSimTransactions.filter((transaction) =>
    matchesDateFilter(transaction.date, simTxDateRange)
  );

  const filteredSimLifecycle = selectedSimLifecycle.filter((event) =>
    matchesDateFilter(event.event_date, simLifecycleDateRange)
  );

  const filteredSimTxTotalPages = Math.max(1, Math.ceil(filteredSimTransactions.length / SIM_TX_PAGE_SIZE));
  const safeFilteredSimTxPage = Math.min(safeSimTxPage, filteredSimTxTotalPages);
  const paginatedFilteredSimTransactions = filteredSimTransactions.slice(
    (safeFilteredSimTxPage - 1) * SIM_TX_PAGE_SIZE,
    safeFilteredSimTxPage * SIM_TX_PAGE_SIZE
  );

  const filteredSimLifecycleTotalPages = Math.max(1, Math.ceil(filteredSimLifecycle.length / SIM_ACTIVITY_PAGE_SIZE));
  const safeFilteredSimLifecyclePage = Math.min(simActivityPage, filteredSimLifecycleTotalPages);
  const simLifecycleStartIndex = (safeFilteredSimLifecyclePage - 1) * SIM_ACTIVITY_PAGE_SIZE;
  const paginatedSimLifecycle = filteredSimLifecycle.slice(
    simLifecycleStartIndex,
    simLifecycleStartIndex + SIM_ACTIVITY_PAGE_SIZE
  );

  useEffect(() => {
    setSimActivityPage(1);
  }, [selectedCustomerSim?.id, selectedSimLifecycle.length]);

  useEffect(() => {
    if (!simTxDateFilter) {
      setSimTxDateFilter(todayDate);
    }
    if (!simLifecycleDateFilter) {
      setSimLifecycleDateFilter(todayDate);
    }
  }, [todayDate, simTxDateFilter, simLifecycleDateFilter]);

  useEffect(() => {
    setSimTxPage(1);
  }, [simTxDateFilter, simTxFilterMode, setSimTxPage]);

  useEffect(() => {
    setSimActivityPage(1);
  }, [simLifecycleDateFilter, simLifecycleFilterMode]);

  const customerId = selectedCustomerInsight?.customer?.id || selectedCustomerSim?.customerId;
  const isReactivatable = ['inactive', 'deactivate'].includes(String(selectedCustomerSim?.status || '').toLowerCase());

  const getStatusLabel = (raw) => {
    const s = String(raw || '').toLowerCase();
    switch (s) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'deactivate':
        return 'Deactivated';
      case 'suspend':
        return 'Suspended';
      case 'pending':
        return 'Pending';
      default:
        return raw ? String(raw).replace(/[_-]/g, ' ') : 'Unknown';
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active') return 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f7ef] text-[#3ebb7f]';
    if (s === 'inactive' || s === 'deactivate') return 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#fdeceb] text-[#e9423a]';
    if (s === 'pending') return 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#fff7e6] text-[#f6a94c]';
    return 'inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#f3f3f3] text-[#828282]';
  };

  const formatMsisdn = (raw) => {
    if (raw === undefined || raw === null || raw === '') return '';
    let s = String(raw).trim();
    // remove spaces, dashes, parentheses
    s = s.replace(/[\s\-()]/g, '');
    // remove leading plus
    s = s.replace(/^\+/, '');
    // strip leading country code 855 if present
    if (s.startsWith('855')) {
      s = s.substring(3);
    }
    return s;
  };

  const handleTopUp = async () => {
    if (!selectedCustomerSim || !topUpAmount) {
      toast.error('Please enter an amount');
      return;
    }
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (!userId) {
      toast.error('Missing user context. Please login again.');
      return;
    }
    if (!branchId) {
      toast.error('Missing branch context. Please select a branch user.');
      return;
    }
    if (!customerId) {
      toast.error('Missing customer for this SIM.');
      return;
    }
    try {
      setIsToppingUp(true);
      await addBalanceToSim({
        userId,
        branchId,
        customerId,
        simId: selectedCustomerSim.id,
        amount,
      });
      toast.success(`Successfully topped up $${amount.toFixed(2)} to SIM ${selectedCustomerSim.msisdn || selectedCustomerSim.id}`);
      setIsTopUpOpen(false);
      setTopUpAmount('');
      if (typeof refreshData === 'function') {
        await refreshData(selectedCustomerSim.id);
      }
    } catch (error) {
      console.error('Failed to top up:', error);
      toast.error(error.message || 'Failed to top up. Please try again.');
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedCustomerSim) {
      return;
    }
    if (!userId && userId !== 0) {
      toast.error('Missing user context. Please login again.');
      return;
    }
    try {
      setIsDeactivating(true);
      await deactivateSim({
        simId: selectedCustomerSim.id,
        changedBy: userId,
      });
      toast.success('SIM deactivated. Number released and available for reassignment.');
      setIsDeactivateOpen(false);
      if (typeof refreshData === 'function') {
        await refreshData(selectedCustomerSim.id);
      }
    } catch (error) {
      console.error('Failed to deactivate SIM:', error);
      toast.error(error.message || 'Failed to deactivate SIM. Please try again.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivate = () => {
    if (!selectedCustomerSim || typeof setSellingSIM !== 'function' || typeof setIsSellModalOpen !== 'function') {
      return;
    }

    setSellingSIM({
      ...selectedCustomerSim,
      reactivate: true,
      lockedCustomer: selectedCustomerInsight?.customer || null,
    });
    setIsSellModalOpen(true);
  };

  if (!selectedCustomerSim) {
    return (
      <div className="border border-[#f3f3f3] rounded-xl bg-white p-6 text-sm text-[#828282] text-center">
        SIM profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <BackButton onClick={() => setActiveTab('customer-profile')} label="Back to Customer"/>
      </div>

      <div className="border border-[#f3f3f3] rounded-xl bg-white p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1f1f1f]">SIM Profile</h1>
            {/* <h3 className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'No MSISDN'} • SIM #{selectedCustomerSim.id}</h3> */}
            {/* <p className="text-sm text-[#828282]">ICCID: {selectedCustomerSim.iccid || 'N/A'}</p> */}
          </div>
          <div className="flex items-center gap-2">
            {isReactivatable ? (
              <Button
                size="sm"
                className="h-8 px-4 bg-[#3ebb7f] hover:bg-[#3ebb7f]/90 text-white whitespace-nowrap"
                onClick={handleReactivate}
              >
                Reactivate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-4 text-[#e9423a] border-[#f3f3f3] hover:bg-[#fdeceb] whitespace-nowrap"
                onClick={() => setIsDeactivateOpen(true)}
                disabled={selectedCustomerSim.status === 'deactivate' || isDeactivating}
              >
                Deactivate
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 px-4 bg-[#5b93ff] hover:bg-[#5b93ff]/90 text-white whitespace-nowrap"
              onClick={() => setIsTopUpOpen(true)}
            >
              Top Up
            </Button>
          </div>
              {/* Top Up Modal */}
              <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Top Up SIM</DialogTitle>
                    <DialogDescription>
                      Add balance to SIM: {formatMsisdn(selectedCustomerSim?.msisdn) || selectedCustomerSim?.id}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="topup-amount">Amount (USD)</Label>
                      <Input
                        id="topup-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter amount"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsTopUpOpen(false)} disabled={isToppingUp}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTopUp}
                        className="bg-[#5b93ff] hover:bg-[#5b93ff]/90"
                        disabled={isToppingUp || !topUpAmount}
                      >
                        {isToppingUp ? 'Processing...' : 'Top Up'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
        </div>

        <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate SIM</AlertDialogTitle>
              <AlertDialogDescription>
                This will set the SIM status to deactivate, remove the MSISDN from this SIM, and make the number available for reassignment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivate} disabled={isDeactivating}>
                {isDeactivating ? 'Deactivating...' : 'Confirm Deactivate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">MSISDN</p>
            <p className="text-base font-semibold text-[#1f1f1f]">{formatMsisdn(selectedCustomerSim.msisdn) || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Status</p>
            <span
              className={
                `inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ` +
                (selectedCustomerSim.status === 'active'
                  ? 'bg-[#e6f7ef] text-[#3ebb7f]'
                  : selectedCustomerSim.status === 'inactive' || selectedCustomerSim.status === 'deactivate'
                  ? 'bg-[#fdeceb] text-[#e9423a]'
                  : selectedCustomerSim.status === 'pending'
                  ? 'bg-[#fff7e6] text-[#f6a94c]'
                  : 'bg-[#f3f3f3] text-[#828282]')
              }
            >
              {getStatusLabel(selectedCustomerSim.status)}
            </span>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Plan</p>
            <p className="text-base font-semibold text-[#1f1f1f]">{plans.find((plan) => plan.id === selectedCustomerSim.planId)?.name || (selectedCustomerSim.planId ? `Plan #${selectedCustomerSim.planId}` : 'No plan')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Owner</p>
            <p className="text-base font-semibold text-[#1f1f1f] mt-1">{selectedCustomerInsight?.customer?.name || selectedCustomerSim.assignedTo || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Created</p>
              <p className="text-sm text-[#1f1f1f]">{formatDateWithMonthName(selectedCustomerSim.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-[#1f1f1f]">SIM Transactions</h4>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-md border border-[#f3f3f3] bg-white px-2 text-sm"
                  value={simTxFilterMode}
                  onChange={(event) => setSimTxFilterMode(event.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  {/* <option value="custom">Date</option> */}
                  <option value="all">All</option>
                </select>
                <Input
                  type="date"
                  className="h-8"
                  value={simTxDateFilter}
                  onChange={(event) => {
                    setSimTxFilterMode('custom');
                    setSimTxDateFilter(event.target.value);
                  }}
                />
              </div>
            </div>
            {filteredSimTransactions.length === 0 ? (
              <p className="text-sm text-[#828282]">No transactions found for this filter.</p>
            ) : (

              // Paginated list of transactions
              <div className="space-y-2">
                {paginatedFilteredSimTransactions.map((transaction) => (
                  <div key={`sim-tx-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                    {/* Transaction details */}
                    <div className="flex items-center gap-3">
                      {/* Transaction status badge and type */}
                      <StatusBadge status={transaction.status} type="transaction" />
                      <p className="text-sm text-[#1f1f1f] capitalize ml-2">{String(transaction.type || 'transaction').replace(/_/g, ' ')} </p>
                      <p className="text-xs text-[#828282] ml-auto">{formatDateTime(transaction.date)}</p>
                    </div>
                      {/* align with the complete span */}
                    <p className="text-xs text-[#828282] mt-1 ml-3 ">By: {transaction.userName || 'System'}</p>
                    <div className="text-xs text-[#828282] mt-1 ml-3 flex flex-wrap gap-3">
                      {transaction.msisdn ? <span>MSISDN: {formatMsisdn(transaction.msisdn)}</span> : null}
                      {transaction.planName ? <span>Plan: {transaction.planName}</span> : null}
                      {transaction.amount != null ? <span>Amount: ${Number(transaction.amount).toFixed(2)}</span> : null}
                      {transaction.notes ? <span className="w-full">{transaction.notes}</span> : null}
                    </div>
                  </div>
                ))}

                {/* Pagination controls */}
                {filteredSimTransactions.length > SIM_TX_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-[#828282]">Page {safeFilteredSimTxPage} of {filteredSimTxTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.max(1, previous - 1))} disabled={safeFilteredSimTxPage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.min(filteredSimTxTotalPages, previous + 1))} disabled={safeFilteredSimTxPage >= filteredSimTxTotalPages}>
                        <ChevronRight className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
{/* SIM Lifecycle Events */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-[#1f1f1f]">SIM Activity</h4>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-md border border-[#f3f3f3] bg-white px-2 text-sm"
                  value={simLifecycleFilterMode}
                  onChange={(event) => setSimLifecycleFilterMode(event.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  {/* <option value="custom">Date</option> */}
                  <option value="all">All</option>
                </select>
                <Input
                  type="date"
                  className="h-8"
                  value={simLifecycleDateFilter}
                  onChange={(event) => {
                    setSimLifecycleFilterMode('custom');
                    setSimLifecycleDateFilter(event.target.value);
                  }}
                />
              </div>
            </div>
            {isSimLifecycleLoading ? (
              <Loading message="Loading activity..." size="sm" />
            ) : filteredSimLifecycle.length === 0 ? (
              <p className="text-sm text-[#828282]">No lifecycle events found for this filter.</p>
            ) : (
              <div className="space-y-2">
                {paginatedSimLifecycle.map((event, index) => {
                  const summaryText = event.summary || '';
                  const lowerSummary = String(summaryText).toLowerCase();
                  const isActivationSummary = /sold|reactiv|activated/i.test(lowerSummary);

                  return (
                    <div key={`sim-life-${event.id ?? event.event_date ?? 'event'}-${event.summary ?? 'update'}-${index}`} className="rounded-md border border-[#f3f3f3] p-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                          {String(event.event_type || '').toLowerCase() === 'status_change' && (event.old_status || event.new_status) ? (
                            isActivationSummary ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className={`${getStatusBadgeClass(event.new_status)} ml-2 ring-2 ring-[#3ebb7f]`}>{getStatusLabel(event.new_status_label || event.new_status || '')}</span>
                                  <p className="text-sm text-[#1f1f1f] font-semibold ml-3">{summaryText}</p>
                                </div>
                                {/* {event.details && <p className="text-xs text-[#828282] mt-1">{event.details}</p>} */}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className={getStatusBadgeClass(event.old_status)}>{getStatusLabel(event.old_status_label || event.old_status || '')}</span>
                                  <ChevronRight className="w-4 h-4 text-[#828282]" />
                                  <span className={getStatusBadgeClass(event.new_status)}>{getStatusLabel(event.new_status_label || event.new_status || '')}</span>
                                </div>
                                {/* {event.details && <p className="text-xs text-[#828282] mt-1 ml-3  ">{event.details}</p>} */}
                                {event.summary && <p className="text-xs text-[#828282] mt-1 ml-3">{event.summary}</p>}
                              </>
                            )
                          ) : String(event.event_type || '').toLowerCase() === 'owner_change' && (event.old_owner || event.new_owner) ? (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-[#1f1f1f] ml-3">Owner:</p>
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#f3f3f3] text-[#828282]">{event.old_owner || 'Unassigned'}</span>
                                <ChevronRight className="w-4 h-4 text-[#828282]" />
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f7ef] text-[#3ebb7f]">{event.new_owner || 'Unassigned'}</span>
                              </div>
                              {event.details && <p className="text-xs text-[#828282] mt-1 ml-3">{event.details}</p>}
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-[#1f1f1f] ml-3">{event.summary || 'SIM update'}</p>
                              {/* {event.details && <p className="text-xs text-[#828282] mt-1 ml-3">{event.details}</p>} */}
                              {event.details && <p className="text-xs text-[#828282] mt-1 ml-3">{event.details}</p>}
                            </>
                          )}
                        </div>
                        <p className="text-xs text-[#828282]">{formatDateTime(event.event_date)}</p>
                      </div>
                    </div>
                  );
                })}
                {filteredSimLifecycle.length > SIM_ACTIVITY_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-[#828282]">Page {safeFilteredSimLifecyclePage} of {filteredSimLifecycleTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimActivityPage((previous) => Math.max(1, previous - 1))} disabled={safeFilteredSimLifecyclePage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimActivityPage((previous) => Math.min(filteredSimLifecycleTotalPages, previous + 1))} disabled={safeFilteredSimLifecyclePage >= filteredSimLifecycleTotalPages}>
                        <ChevronRight className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


