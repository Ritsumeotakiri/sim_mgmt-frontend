import React, { useState } from 'react';
import { Mail, Phone, ShieldCheck, Smartphone, CreditCard, Activity, Clock3, PlusCircle } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { BackButton } from '@/presentation/views/components/common/BackButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'sonner';
import { formatDateTime } from '../utils/dateUtils';
import { CUSTOMER_SIMS_PAGE_SIZE, TIMELINE_PAGE_SIZE } from '../utils/constants';
import { addBalanceToSim, assignPlanToSim } from '@/data/services/backendApi/sim';

export const CustomerProfileTab = ({
  selectedCustomerInsight,
  paginatedCustomerSims,
  paginatedTimeline,
  selectedCustomerTimeline,
  setCustomerSimsPage,
  customerSimsTotalPages,
  safeCustomerSimsPage,
  setTimelinePage,
  timelineTotalPages,
  safeTimelinePage,
  plans,
  setSelectedCustomerSim,
  setActiveTab,
  setSellingSIM,
  setIsSellModalOpen,
  userId, // Add userId prop
  branchId, // Add branchId prop
  refreshData,
}) => {
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [selectedSimForBalance, setSelectedSimForBalance] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [selectedSimForPlan, setSelectedSimForPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  if (!selectedCustomerInsight) {
    return (
      <div className="border border-[#f3f3f3] rounded-xl bg-white p-6 text-sm text-[#828282] text-center">
        Customer profile not found.
      </div>
    );
  }

  const { customer, customerTransactions, activeSims, customerSims } = selectedCustomerInsight;

  const handleAddBalance = async () => {
    if (!selectedSimForBalance || !balanceAmount) {
      toast.error('Please enter an amount');
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setIsAddingBalance(true);
      
      await addBalanceToSim({
        userId: userId,
        branchId: branchId,
        customerId: customer.id,
        simId: selectedSimForBalance.id,
        amount: amount,
      });

      toast.success(`Successfully added $${amount.toFixed(2)} to SIM ${selectedSimForBalance.msisdn || selectedSimForBalance.id}`);
      setIsAddBalanceOpen(false);
      setSelectedSimForBalance(null);
      setBalanceAmount('');
      
      // Refresh customer/transaction data to update timeline and SIM profile
      if (typeof refreshData === 'function' && selectedSimForBalance) {
        await refreshData(selectedSimForBalance.id);
      }
      
    } catch (error) {
      console.error('Failed to add balance:', error);
      toast.error(error.message || 'Failed to add balance. Please try again.');
    } finally {
      setIsAddingBalance(false);
    }
  };

  const openAddBalanceModal = (sim, event) => {
    event.stopPropagation(); // Prevent opening SIM profile when clicking the button
    setSelectedSimForBalance(sim);
    setIsAddBalanceOpen(true);
  };

  const openChangePlanModal = (sim, event) => {
    event.stopPropagation();
    setSelectedSimForPlan(sim);
    setSelectedPlanId(sim.planId ? String(sim.planId) : '');
    setIsChangePlanOpen(true);
  };

  const handleChangePlan = async () => {
    if (!selectedSimForPlan) {
      toast.error('Please select a SIM');
      return;
    }

    const nextPlanId = Number(selectedPlanId);
    if (!Number.isFinite(nextPlanId)) {
      toast.error('Please select a valid plan');
      return;
    }

    if (String(selectedSimForPlan.planId || '') === String(nextPlanId)) {
      toast.error('This SIM is already on the selected plan');
      return;
    }

    try {
      setIsChangingPlan(true);

      await assignPlanToSim({
        simId: selectedSimForPlan.id,
        planId: nextPlanId,
        assignedBy: userId,
      });

      const selectedPlan = plans.find((plan) => String(plan.id) === String(nextPlanId));
      toast.success(`Plan changed to ${selectedPlan?.name || `Plan #${nextPlanId}`}`);

      setIsChangePlanOpen(false);
      setSelectedSimForPlan(null);
      setSelectedPlanId('');

      if (typeof refreshData === 'function') {
        await refreshData(selectedSimForPlan.id);
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
      toast.error(error.message || 'Failed to change plan. Please try again.');
    } finally {
      setIsChangingPlan(false);
    }
  };

  console.log('userId:', userId, 'branchId:', branchId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackButton onClick={() => setActiveTab('frontdesk')} label="Back to Search"/>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-sm">
          <div className="h-28 border-b border-[#f1f1f1] bg-[#fafafa]" />
          <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customer.name || customer.id || 'customer')}`}
                  alt={customer.name || 'Customer'}
                  className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-white shadow-sm object-cover"
                />
                <div className="space-y-3 pt-10 sm:pt-9">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#828282]">Customer Profile</p>
                    <h3 className="text-2xl font-semibold leading-tight text-[#1f1f1f]">{customer.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-[#5f5f5f]">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                      <Mail className="h-4 w-4 text-[#828282]"/>
                      {customer.email || 'No email'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                      <Phone className="h-4 w-4 text-[#828282]"/>
                      {customer.phone || 'No phone'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#828282]"/>
                      ID {customer.idNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="h-10 rounded-xl px-4 bg-[#3ebb7f] hover:bg-[#3ebb7f]/90 text-white shadow-sm lg:self-center" 
                  onClick={() => {
                    setSellingSIM({
                      customerBuyFlow: true,
                      lockedCustomer: customer,
                    });
                    setIsSellModalOpen(true);
                  }}
                >
                  <Smartphone className="mr-2 h-4 w-4"/>
                  Buy SIM
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b93ff]/10 text-[#5b93ff]">
              <CreditCard className="h-5 w-5"/>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Transactions</p>
            <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{customerTransactions.length}</p>
            <p className="mt-1 text-sm text-[#828282]">All purchase and service actions</p>
          </div>
          <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6a94c]/10 text-[#f6a94c]">
              <Smartphone className="h-5 w-5"/>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Total SIMs</p>
            <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{customerSims.length}</p>
            <p className="mt-1 text-sm text-[#828282]">Numbers linked to this customer</p>
          </div>
          <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3ebb7f]/10 text-[#3ebb7f]">
              <Activity className="h-5 w-5"/>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#828282]">Active SIMs</p>
            <p className="mt-1 text-2xl font-semibold text-[#1f1f1f]">{activeSims.length}</p>
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
                {customerSims.length} total
              </span>
            </div>
            {customerSims.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#dcdcdc] bg-[#fafafa] p-6 text-center text-sm text-[#828282]">
                No SIMs assigned yet.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedCustomerSims.map((sim) => {
                  const planName = plans.find((plan) => plan.id === sim.planId)?.name || (sim.planId ? `Plan #${sim.planId}` : 'No plan');
                  const isActive = sim.status === 'active';
                  return (
                    <div 
                      key={sim.id} 
                      className="w-full rounded-2xl border border-[#ededed] bg-gradient-to-br from-white to-[#fafafa] p-4 transition-all hover:-translate-y-0.5 hover:border-[#d8d8d8] hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedCustomerSim(sim);
                            setActiveTab('sim-profile');
                          }} 
                          className="flex-1 text-left"
                        >
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
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openAddBalanceModal(sim, e)}
                          className="h-8 px-3 bg-[#5b93ff] hover:bg-[#5b93ff]/90 text-white border-none"
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Balance
                        </Button>
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => openChangePlanModal(sim, e)}
                            className="h-8 px-3 bg-[#f6a94c] hover:bg-[#f6a94c]/90 text-white border-none"
                          >
                            Change Plan
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {customerSims.length > CUSTOMER_SIMS_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 border-t border-[#f3f3f3] pt-3">
                    <p className="text-xs text-[#828282]">Page {safeCustomerSimsPage} of {customerSimsTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setCustomerSimsPage((previous) => Math.max(1, previous - 1))} disabled={safeCustomerSimsPage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setCustomerSimsPage((previous) => Math.min(customerSimsTotalPages, previous + 1))} disabled={safeCustomerSimsPage >= customerSimsTotalPages}>
                        <ChevronRight className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-[#1f1f1f]">Timeline</h4>
              <p className="text-sm text-[#828282]">A recent view of customer lifecycle events.</p>
            </div>
            {selectedCustomerTimeline.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#dcdcdc] bg-[#fafafa] p-6 text-center text-sm text-[#828282]">
                No history yet.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTimeline.map((entry, index) => (
                  <div key={entry.id} className="relative flex items-start gap-3 rounded-2xl border border-[#f1f1f1] bg-[#fcfcfc] p-3.5">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f1f1f]/6 text-[#1f1f1f]">
                        <Clock3 className="h-4 w-4"/>
                      </div>
                      {index < paginatedTimeline.length - 1 && <div className="mt-2 h-8 w-px bg-[#e8e8e8]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {(() => {
                        // Try to extract status from label (e.g., 'Top Up to ... (completed)')
                        const match = entry.label.match(/^(.*) \(([^)]+)\)$/);
                        if (match) {
                          const main = match[1];
                          const status = match[2];
                          let badgeColor = 'bg-[#e0e7ff] text-[#3730a3]';
                          if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'complete') badgeColor = 'bg-[#d1fae5] text-[#065f46]';
                          else if (status.toLowerCase() === 'pending') badgeColor = 'bg-[#fef3c7] text-[#92400e]';
                          else if (status.toLowerCase() === 'failed' || status.toLowerCase() === 'error') badgeColor = 'bg-[#fee2e2] text-[#991b1b]';
                          return <>
                            <p className="text-sm font-medium text-[#1f1f1f]">{main}</p>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold align-middle ${badgeColor}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                          </>;
                        }
                        return <p className="text-sm font-medium text-[#1f1f1f]">{entry.label}</p>;
                      })()}
                      <p className="mt-1 text-xs text-[#828282]">{formatDateTime(entry.date)}</p>
                    </div>
                  </div>
                ))}
                {selectedCustomerTimeline.length > TIMELINE_PAGE_SIZE && (
                  <div className="flex items-center justify-between gap-2 border-t border-[#f3f3f3] pt-3">
                    <p className="text-xs text-[#828282]">Page {safeTimelinePage} of {timelineTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setTimelinePage((previous) => Math.max(1, previous - 1))} disabled={safeTimelinePage <= 1}>
                        <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setTimelinePage((previous) => Math.min(timelineTotalPages, previous + 1))} disabled={safeTimelinePage >= timelineTotalPages}>
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

      {/* Add Balance Modal */}
      <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Balance to SIM</DialogTitle>
            <DialogDescription>
              Add balance to SIM: {selectedSimForBalance?.msisdn || selectedSimForBalance?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddBalanceOpen(false)} disabled={isAddingBalance}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddBalance} 
                className="bg-[#5b93ff] hover:bg-[#5b93ff]/90"
                disabled={isAddingBalance || !balanceAmount}
              >
                {isAddingBalance ? 'Processing...' : 'Add Balance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change SIM Plan</DialogTitle>
            <DialogDescription>
              Select a new plan for SIM: {selectedSimForPlan?.msisdn || selectedSimForPlan?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="change-plan-select">Plan</Label>
              <select
                id="change-plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full rounded-md border border-[#c9c7c7] bg-white px-3 py-2 text-sm text-[#1f1f1f] focus:outline-none focus:border-[#1f1f1f]"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsChangePlanOpen(false)} disabled={isChangingPlan}>
                Cancel
              </Button>
              <Button
                onClick={handleChangePlan}
                className="bg-[#f6a94c] hover:bg-[#f6a94c]/90"
                disabled={isChangingPlan || !selectedPlanId}
              >
                {isChangingPlan ? 'Updating...' : 'Change Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};