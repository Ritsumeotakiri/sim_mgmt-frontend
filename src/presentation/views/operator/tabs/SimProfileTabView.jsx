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
import { SIM_TX_PAGE_SIZE } from '@/presentation/views/operator/utils/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/presentation/components/ui/alert-dialog';

export const SimProfileTabView = ({
  selectedCustomerSim,
  selectedCustomerInsight,
  plans,
  selectedSimTransactions,
  paginatedSimTransactions,
  setSimTxPage,
  simTxTotalPages,
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

  const SIM_ACTIVITY_PAGE_SIZE = 5;
  const simActivityTotalPages = Math.max(1, Math.ceil(selectedSimLifecycle.length / SIM_ACTIVITY_PAGE_SIZE));
  const safeSimActivityPage = Math.min(simActivityPage, simActivityTotalPages);
  const simActivityStartIndex = (safeSimActivityPage - 1) * SIM_ACTIVITY_PAGE_SIZE;
  const paginatedSimLifecycle = selectedSimLifecycle.slice(
    simActivityStartIndex,
    simActivityStartIndex + SIM_ACTIVITY_PAGE_SIZE
  );

  useEffect(() => {
    setSimActivityPage(1);
  }, [selectedCustomerSim?.id, selectedSimLifecycle.length]);

  const customerId = selectedCustomerInsight?.customer?.id || selectedCustomerSim?.customerId;
  const isReactivatable = ['inactive', 'deactivate'].includes(String(selectedCustomerSim?.status || '').toLowerCase());

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
            <h3 className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'No MSISDN'} • SIM #{selectedCustomerSim.id}</h3>
            <p className="text-sm text-[#828282]">ICCID: {selectedCustomerSim.iccid || 'N/A'}</p>
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
                      Add balance to SIM: {selectedCustomerSim?.msisdn || selectedCustomerSim?.id}
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">SIM Transactions</h4>
            {selectedSimTransactions.length === 0 ? (
              <p className="text-sm text-[#828282]">No transactions found for this SIM.</p>
            ) : (
              <div className="space-y-2">
                {paginatedSimTransactions.map((transaction) => (
                  <div key={`sim-tx-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')} ({transaction.status || 'unknown'})</p>
                      <p className="text-xs text-[#828282]">{formatDateTime(transaction.date)}</p>
                    </div>
                    <p className="text-xs text-[#828282] mt-1">By: {transaction.userName || 'System'}</p>
                  </div>
                ))}
                {selectedSimTransactions.length > SIM_TX_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-[#828282]">Page {safeSimTxPage} of {simTxTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.max(1, previous - 1))} disabled={safeSimTxPage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.min(simTxTotalPages, previous + 1))} disabled={safeSimTxPage >= simTxTotalPages}>
                        <ChevronRight className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">SIM Activity</h4>
            {isSimLifecycleLoading ? (
              <p className="text-sm text-[#828282]">Loading activity...</p>
            ) : selectedSimLifecycle.length === 0 ? (
              <p className="text-sm text-[#828282]">No lifecycle events found for this SIM.</p>
            ) : (
              <div className="space-y-2">
                {paginatedSimLifecycle.map((event, index) => (
                  <div key={`sim-life-${event.id ?? event.event_date ?? 'event'}-${event.summary ?? 'update'}-${index}`} className="rounded-md border border-[#f3f3f3] p-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-[#1f1f1f]">{event.summary || 'SIM update'}</p>
                      <p className="text-xs text-[#828282]">{formatDateTime(event.event_date)}</p>
                    </div>
                    {event.details && <p className="text-xs text-[#828282] mt-1">{event.details}</p>}
                  </div>
                ))}
                {selectedSimLifecycle.length > SIM_ACTIVITY_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-[#828282]">Page {safeSimActivityPage} of {simActivityTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimActivityPage((previous) => Math.max(1, previous - 1))} disabled={safeSimActivityPage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimActivityPage((previous) => Math.min(simActivityTotalPages, previous + 1))} disabled={safeSimActivityPage >= simActivityTotalPages}>
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


