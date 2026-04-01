import React from 'react';
import { Search, UserPlus, ShoppingCart, WalletCards, Repeat, User, Check, Phone, Package } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/presentation/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { FRONTDESK_PAGE_SIZE } from '@/presentation/views/operator/utils/constants';
import { useFrontDeskActionsViewModel } from '@/presentation/viewModels/operator/useFrontDeskActionsViewModel';

export const FrontDeskTabView = ({
  customers,
  sims,
  plans,
  filteredCustomerInsights,
  frontDeskSearch,
  setFrontDeskSearch,
  frontDeskFilters,
  toggleFrontDeskFilter,
  activeFilterCount,
  canAddCustomer,
  setIsAddCustomerOpen,
  openCustomerPage,
//   frontDeskPage,
  setFrontDeskPage,
  frontDeskTotalPages,
  safeFrontDeskPage,
  onOpenSaleAction,
  onSubmitTopUpAction,
  onSubmitChangePlanAction,
}) => {
  const paginatedCustomers = filteredCustomerInsights.slice(
    (safeFrontDeskPage - 1) * FRONTDESK_PAGE_SIZE,
    safeFrontDeskPage * FRONTDESK_PAGE_SIZE
  );
  const {
    isTopUpOpen,
    setIsTopUpOpen,
    isChangePlanOpen,
    setIsChangePlanOpen,
    selectedCustomerIdForTopUp,
    setSelectedCustomerIdForTopUp,
    topUpCustomerSearch,
    setTopUpCustomerSearch,
    selectedSimIdForTopUp,
    setSelectedSimIdForTopUp,
    topUpAmount,
    setTopUpAmount,
    topUpStep,
    setTopUpStep,
    setTopUpCustomerPage,
    setTopUpSimPage,
    isSubmittingTopUp,
    selectedCustomerIdForPlan,
    setSelectedCustomerIdForPlan,
    planCustomerSearch,
    setPlanCustomerSearch,
    selectedSimIdForPlan,
    setSelectedSimIdForPlan,
    selectedPlanId,
    setSelectedPlanId,
    changePlanStep,
    setChangePlanStep,
    setPlanCustomerPage,
    setPlanSimPage,
    setPlanListPage,
    isSubmittingPlan,
    simsByTopUpCustomer,
    filteredTopUpCustomers,
    activeSimsByPlanCustomer,
    filteredPlanCustomers,
    SELECTOR_PAGE_SIZE,
    topUpCustomerTotalPages,
    safeTopUpCustomerPage,
    topUpCustomerStartIndex,
    paginatedTopUpCustomers,
    topUpSimTotalPages,
    safeTopUpSimPage,
    topUpSimStartIndex,
    paginatedTopUpSims,
    planCustomerTotalPages,
    safePlanCustomerPage,
    planCustomerStartIndex,
    paginatedPlanCustomers,
    planSimTotalPages,
    safePlanSimPage,
    planSimStartIndex,
    paginatedPlanSims,
    planTotalPages,
    safePlanListPage,
    planListStartIndex,
    paginatedPlans,
    handleQuickSale,
    openTopUpDialog,
    openChangePlanDialog,
    canProceedTopUp,
    canProceedChangePlan,
    handleTopUpNext,
    handleChangePlanNext,
  } = useFrontDeskActionsViewModel({
    customers,
    sims,
    plans,
    onOpenSaleAction,
    onSubmitTopUpAction,
    onSubmitChangePlanAction,
  });

  const handleTopUpNextWithToast = async () => {
    const isSubmittingStep = topUpStep === 3;
    try {
      await handleTopUpNext();
      if (isSubmittingStep) {
        toast.success('Top up completed');
      }
    } catch (error) {
      toast.error(error?.message || 'Top up failed');
    }
  };

  const handleChangePlanNextWithToast = async () => {
    const isSubmittingStep = changePlanStep === 3;
    try {
      await handleChangePlanNext();
      if (isSubmittingStep) {
        toast.success('Plan changed successfully');
      }
    } catch (error) {
      toast.error(error?.message || 'Change plan failed');
    }
  };

  
  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2">
        <button type="button" onClick={handleQuickSale} className="rounded-xl border border-[#d9d9d9] bg-[#f8f8f8] p-4 shadow-sm text-center transition-all hover:border-[#cfcfcf] hover:bg-[#f2f2f2] min-h-[96px] flex flex-col items-center justify-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-white">
            <ShoppingCart className="h-4 w-4"/>
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1f1f1f]">Sale SIM</div>
        </button>
        <button type="button" onClick={openTopUpDialog} className="rounded-xl border border-[#d8e4ff] bg-[#eef4ff] p-4 shadow-sm text-center transition-all hover:border-[#c9d8ff] hover:bg-[#e5efff] min-h-[96px] flex flex-col items-center justify-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5b93ff] text-white">
            <WalletCards className="h-4 w-4"/>
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f4f8f]">Top Up</div>
        </button>
        <button type="button" onClick={openChangePlanDialog} className="rounded-xl border border-[#ffe5c8] bg-[#fff5e9] p-4 shadow-sm text-center transition-all hover:border-[#ffd9ae] hover:bg-[#ffefdb] min-h-[96px] flex flex-col items-center justify-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f6a94c] text-white">
            <Repeat className="h-4 w-4"/>
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5b1d]">Change Plan</div>
        </button>
      </div>
      <div className="bg-[#f9f9f9] rounded-xl border border-[#f3f3f3] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#828282] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <Input
              value={frontDeskSearch}
              onChange={(event) => setFrontDeskSearch(event.target.value)}
              placeholder="Search by name, phone, email, ID number"
              className="pl-9 h-9 text-sm"
              style={{ minWidth: 0 }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs min-w-[100px]">
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Activity</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.withTransactions}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('withTransactions')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>With transactions</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.noTransactions}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('noTransactions')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>No transactions</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">SIM state</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.withActiveSim}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('withActiveSim')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>With active SIM</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.noActiveSim}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('noActiveSim')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>No active SIM</span>
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canAddCustomer && (
            <Button onClick={() => setIsAddCustomerOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90 h-9 px-4 text-sm flex-shrink-0">
              <UserPlus className="w-4 h-4 mr-2" />
              Register New Customer
            </Button>
          )}
        </div>
      </div>

      <div className="border border-[#f3f3f3] rounded-xl bg-white overflow-hidden">
        {filteredCustomerInsights.length === 0 ? (
          <div className="text-sm text-[#828282] py-12 text-center">No customer matches your search.</div>
        ) : (
          <div className="divide-y divide-[#f1f1f1]">
            {paginatedCustomers.map(({ customer, customerTransactions, activeSims }) => {
              const initials = String(customer.name || 'Customer')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('');

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => openCustomerPage(customer.id)}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1f]/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-[#f3f3f3] text-[#1f1f1f] flex items-center justify-center text-sm font-semibold">
                      {initials || 'CU'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-[#1f1f1f] truncate">{customer.name}</p>
                        <span className="text-xs text-[#828282]">ID {customer.idNumber || 'N/A'}</span>
                      </div>
                      <p className="text-sm text-[#828282] truncate">{customer.email || 'No email'} • {customer.phone || 'No phone'}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2 text-xs text-[#5f5f5f] sm:flex-row sm:items-center sm:gap-2">
                      <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5">
                        {customerTransactions.length} transaction(s)
                      </span>
                      <span className="rounded-full bg-[#eef4ff] text-[#2f4f8f] px-3 py-1.5">
                        {activeSims.length} active SIM(s)
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredCustomerInsights.length > FRONTDESK_PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
                <p className="text-xs text-[#828282]">Page {safeFrontDeskPage} of {frontDeskTotalPages}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.max(1, previous - 1))} disabled={safeFrontDeskPage <= 1}>
                    <ChevronLeft className="w-4 h-4"/>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.min(frontDeskTotalPages, previous + 1))} disabled={safeFrontDeskPage >= frontDeskTotalPages}>
                    <ChevronRight className="w-4 h-4"/>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Top Up</DialogTitle>
            <DialogDescription>Step-by-step top up flow.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-2 mt-1">
            {[1, 2, 3].map((stepNumber) => (
              <div key={`topup-step-${stepNumber}`} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${topUpStep >= stepNumber ? 'bg-[#1f1f1f] text-white' : 'bg-[#f3f3f3] text-[#828282]'}`}>
                  {topUpStep > stepNumber ? <Check className="w-3.5 h-3.5"/> : stepNumber}
                </div>
                <span className={`ml-2 text-xs ${topUpStep >= stepNumber ? 'text-[#1f1f1f] font-medium' : 'text-[#828282]'}`}>
                  {stepNumber === 1 ? 'Customer' : stepNumber === 2 ? 'SIM' : 'Amount'}
                </span>
                {stepNumber < 3 && <div className="w-8 h-px bg-[#e5e5e5] mx-3"/>}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {topUpStep === 1 && (<>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-topup-customer-search">Search Customer</Label>
                  <Input
                    id="quick-topup-customer-search"
                    value={topUpCustomerSearch}
                    onChange={(event) => {
                      setTopUpCustomerSearch(event.target.value);
                      setTopUpCustomerPage(1);
                    }}
                    placeholder="Search by customer name"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {paginatedTopUpCustomers.map((customer) => (
                    <button
                      key={`topup-customer-${customer.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerIdForTopUp(customer.id);
                        setSelectedSimIdForTopUp('');
                        setTopUpSimPage(1);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${String(selectedCustomerIdForTopUp) === String(customer.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#5b93ff]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#5b93ff]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1f1f1f] truncate">{customer.name}</p>
                        <p className="text-xs text-[#828282] truncate">{customer.email || 'No email'} • {customer.phone || 'No phone'}</p>
                      </div>
                      {String(selectedCustomerIdForTopUp) === String(customer.id) && (<Check className="w-5 h-5 text-[#1f1f1f]"/>) }
                    </button>
                  ))}
                  {filteredTopUpCustomers.length === 0 && (
                    <p className="text-sm text-[#828282] text-center py-4">No customer found.</p>
                  )}
                </div>
                {filteredTopUpCustomers.length > SELECTOR_PAGE_SIZE && (
                  <div className="flex items-center justify-between text-xs text-[#828282]">
                    <span>Showing {topUpCustomerStartIndex + 1}-{Math.min(topUpCustomerStartIndex + paginatedTopUpCustomers.length, filteredTopUpCustomers.length)} of {filteredTopUpCustomers.length}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopUpCustomerPage((previous) => Math.max(1, previous - 1))} disabled={safeTopUpCustomerPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safeTopUpCustomerPage}/{topUpCustomerTotalPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopUpCustomerPage((previous) => Math.min(topUpCustomerTotalPages, previous + 1))} disabled={safeTopUpCustomerPage === topUpCustomerTotalPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>
                )}
              </>)}

            {topUpStep === 2 && (<>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {paginatedTopUpSims.map((sim) => (
                    <button
                      key={`topup-sim-${sim.id}`}
                      type="button"
                      onClick={() => setSelectedSimIdForTopUp(sim.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${String(selectedSimIdForTopUp) === String(sim.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3ebb7f]/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#3ebb7f]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1f1f1f] truncate">{sim.msisdn || `SIM #${sim.id}`}</p>
                        <p className="text-xs text-[#828282] truncate">ICCID {sim.iccid || '-'} • {sim.status}</p>
                      </div>
                      {String(selectedSimIdForTopUp) === String(sim.id) && (<Check className="w-5 h-5 text-[#1f1f1f]"/>) }
                    </button>
                  ))}
                  {simsByTopUpCustomer.length === 0 && (
                    <p className="text-sm text-[#828282] text-center py-4">No SIM found for this customer.</p>
                  )}
                </div>
                {simsByTopUpCustomer.length > SELECTOR_PAGE_SIZE && (
                  <div className="flex items-center justify-between text-xs text-[#828282]">
                    <span>Showing {topUpSimStartIndex + 1}-{Math.min(topUpSimStartIndex + paginatedTopUpSims.length, simsByTopUpCustomer.length)} of {simsByTopUpCustomer.length}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopUpSimPage((previous) => Math.max(1, previous - 1))} disabled={safeTopUpSimPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safeTopUpSimPage}/{topUpSimTotalPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopUpSimPage((previous) => Math.min(topUpSimTotalPages, previous + 1))} disabled={safeTopUpSimPage === topUpSimTotalPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>
                )}
              </>)}

            {topUpStep === 3 && (<div className="space-y-1.5">
                <Label htmlFor="quick-topup-amount">Amount</Label>
                <Input
                  id="quick-topup-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                  placeholder="e.g. 5.00"
                />
              </div>)}
          </div>
          <DialogFooter>
            {topUpStep === 1 ? (
              <Button type="button" variant="outline" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setTopUpStep((previous) => Math.max(1, previous - 1))}>Back</Button>
            )}
            <Button type="button" onClick={handleTopUpNextWithToast} disabled={!canProceedTopUp() || isSubmittingTopUp}>
              {topUpStep === 3 ? (isSubmittingTopUp ? 'Processing...' : 'Submit Top Up') : 'Next'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Change Plan</DialogTitle>
            <DialogDescription>Step-by-step plan change flow.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-2 mt-1">
            {[1, 2, 3].map((stepNumber) => (
              <div key={`plan-step-${stepNumber}`} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${changePlanStep >= stepNumber ? 'bg-[#1f1f1f] text-white' : 'bg-[#f3f3f3] text-[#828282]'}`}>
                  {changePlanStep > stepNumber ? <Check className="w-3.5 h-3.5"/> : stepNumber}
                </div>
                <span className={`ml-2 text-xs ${changePlanStep >= stepNumber ? 'text-[#1f1f1f] font-medium' : 'text-[#828282]'}`}>
                  {stepNumber === 1 ? 'Customer' : stepNumber === 2 ? 'SIM' : 'Plan'}
                </span>
                {stepNumber < 3 && <div className="w-8 h-px bg-[#e5e5e5] mx-3"/>}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {changePlanStep === 1 && (<>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-plan-customer-search">Search Customer</Label>
                  <Input
                    id="quick-plan-customer-search"
                    value={planCustomerSearch}
                    onChange={(event) => {
                      setPlanCustomerSearch(event.target.value);
                      setPlanCustomerPage(1);
                    }}
                    placeholder="Search by customer name"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {paginatedPlanCustomers.map((customer) => (
                    <button
                      key={`plan-customer-${customer.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerIdForPlan(customer.id);
                        setSelectedSimIdForPlan('');
                        setPlanSimPage(1);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${String(selectedCustomerIdForPlan) === String(customer.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#5b93ff]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#5b93ff]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1f1f1f] truncate">{customer.name}</p>
                        <p className="text-xs text-[#828282] truncate">{customer.email || 'No email'} • {customer.phone || 'No phone'}</p>
                      </div>
                      {String(selectedCustomerIdForPlan) === String(customer.id) && (<Check className="w-5 h-5 text-[#1f1f1f]"/>) }
                    </button>
                  ))}
                  {filteredPlanCustomers.length === 0 && (
                    <p className="text-sm text-[#828282] text-center py-4">No customer found.</p>
                  )}
                </div>
                {filteredPlanCustomers.length > SELECTOR_PAGE_SIZE && (
                  <div className="flex items-center justify-between text-xs text-[#828282]">
                    <span>Showing {planCustomerStartIndex + 1}-{Math.min(planCustomerStartIndex + paginatedPlanCustomers.length, filteredPlanCustomers.length)} of {filteredPlanCustomers.length}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanCustomerPage((previous) => Math.max(1, previous - 1))} disabled={safePlanCustomerPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safePlanCustomerPage}/{planCustomerTotalPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanCustomerPage((previous) => Math.min(planCustomerTotalPages, previous + 1))} disabled={safePlanCustomerPage === planCustomerTotalPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>
                )}
              </>)}

            {changePlanStep === 2 && (<>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {paginatedPlanSims.map((sim) => (
                    <button
                      key={`plan-sim-${sim.id}`}
                      type="button"
                      onClick={() => setSelectedSimIdForPlan(sim.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${String(selectedSimIdForPlan) === String(sim.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#3ebb7f]/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#3ebb7f]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1f1f1f] truncate">{sim.msisdn || `SIM #${sim.id}`}</p>
                        <p className="text-xs text-[#828282] truncate">ICCID {sim.iccid || '-'} • current plan {sim.planId || 'none'}</p>
                      </div>
                      {String(selectedSimIdForPlan) === String(sim.id) && (<Check className="w-5 h-5 text-[#1f1f1f]"/>) }
                    </button>
                  ))}
                  {activeSimsByPlanCustomer.length === 0 && (
                    <p className="text-sm text-[#828282] text-center py-4">No active SIM found for this customer.</p>
                  )}
                </div>
                {activeSimsByPlanCustomer.length > SELECTOR_PAGE_SIZE && (
                  <div className="flex items-center justify-between text-xs text-[#828282]">
                    <span>Showing {planSimStartIndex + 1}-{Math.min(planSimStartIndex + paginatedPlanSims.length, activeSimsByPlanCustomer.length)} of {activeSimsByPlanCustomer.length}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanSimPage((previous) => Math.max(1, previous - 1))} disabled={safePlanSimPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safePlanSimPage}/{planSimTotalPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanSimPage((previous) => Math.min(planSimTotalPages, previous + 1))} disabled={safePlanSimPage === planSimTotalPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>
                )}
              </>)}

            {changePlanStep === 3 && (<>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {paginatedPlans.map((plan) => (
                    <button
                      key={`target-plan-${plan.id}`}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${String(selectedPlanId) === String(plan.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#f6a94c]/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#f6a94c]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1f1f1f] truncate">{plan.name}</p>
                        <p className="text-xs text-[#828282] truncate">${Number(plan.price || 0).toFixed(2)}</p>
                      </div>
                      {String(selectedPlanId) === String(plan.id) && (<Check className="w-5 h-5 text-[#1f1f1f]"/>) }
                    </button>
                  ))}
                  {plans.length === 0 && (
                    <p className="text-sm text-[#828282] text-center py-4">No plan found.</p>
                  )}
                </div>
                {plans.length > SELECTOR_PAGE_SIZE && (
                  <div className="flex items-center justify-between text-xs text-[#828282]">
                    <span>Showing {planListStartIndex + 1}-{Math.min(planListStartIndex + paginatedPlans.length, plans.length)} of {plans.length}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanListPage((previous) => Math.max(1, previous - 1))} disabled={safePlanListPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safePlanListPage}/{planTotalPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanListPage((previous) => Math.min(planTotalPages, previous + 1))} disabled={safePlanListPage === planTotalPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>
                )}
              </>)}
          </div>
          <DialogFooter>
            {changePlanStep === 1 ? (
              <Button type="button" variant="outline" onClick={() => setIsChangePlanOpen(false)}>Cancel</Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setChangePlanStep((previous) => Math.max(1, previous - 1))}>Back</Button>
            )}
            <Button type="button" onClick={handleChangePlanNextWithToast} disabled={!canProceedChangePlan() || isSubmittingPlan}>
              {changePlanStep === 3 ? (isSubmittingPlan ? 'Updating...' : 'Submit Plan Change') : 'Next'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
