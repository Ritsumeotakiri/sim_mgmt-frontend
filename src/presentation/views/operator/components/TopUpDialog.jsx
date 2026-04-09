import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Check, ChevronLeft, ChevronRight, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export const TopUpDialog = ({ actions }) => {
  const {
    isTopUpOpen,
    setIsTopUpOpen,
    topUpStep,
    setTopUpStep,
    selectedCustomerIdForTopUp,
    setSelectedCustomerIdForTopUp,
    topUpCustomerSearch,
    setTopUpCustomerSearch,
    selectedSimIdForTopUp,
    setSelectedSimIdForTopUp,
    topUpAmount,
    setTopUpAmount,
    isSubmittingTopUp,
    simsByTopUpCustomer,
    filteredTopUpCustomers,
    SELECTOR_PAGE_SIZE,
    topUpCustomerTotalPages,
    safeTopUpCustomerPage,
    topUpCustomerStartIndex,
    paginatedTopUpCustomers,
    topUpSimTotalPages,
    safeTopUpSimPage,
    topUpSimStartIndex,
    paginatedTopUpSims,
    canProceedTopUp,
    handleTopUpNext,
    setTopUpCustomerPage,
    setTopUpSimPage,
  } = actions;

  // Step description for accessibility
  const stepDescription = useMemo(() => {
    switch (topUpStep) {
      case 1:
        return 'Select a customer';
      case 2:
        return 'Choose a SIM card';
      case 3:
        return 'Enter top‑up amount';
      default:
        return '';
    }
  }, [topUpStep]);

  const handleNext = useCallback(async () => {
    const isSubmitting = topUpStep === 3;
    try {
      await handleTopUpNext();
      if (isSubmitting) {
        toast.success('Top up completed');
      }
    } catch (error) {
      toast.error(error?.message || 'Top up failed');
    }
  }, [handleTopUpNext, topUpStep]);

  const handleCustomerSearchChange = useCallback(
    (e) => {
      setTopUpCustomerSearch(e.target.value);
      setTopUpCustomerPage(1);
    },
    [setTopUpCustomerSearch, setTopUpCustomerPage]
  );

  const selectCustomer = useCallback(
    (customerId) => {
      setSelectedCustomerIdForTopUp(customerId);
      setSelectedSimIdForTopUp('');
      setTopUpSimPage(1);
    },
    [setSelectedCustomerIdForTopUp, setSelectedSimIdForTopUp, setTopUpSimPage]
  );

  const handleCustomerPrevPage = useCallback(
    () => setTopUpCustomerPage((p) => Math.max(1, p - 1)),
    [setTopUpCustomerPage]
  );
  const handleCustomerNextPage = useCallback(
    () => setTopUpCustomerPage((p) => Math.min(topUpCustomerTotalPages, p + 1)),
    [setTopUpCustomerPage, topUpCustomerTotalPages]
  );

  const handleSimPrevPage = useCallback(
    () => setTopUpSimPage((p) => Math.max(1, p - 1)),
    [setTopUpSimPage]
  );
  const handleSimNextPage = useCallback(
    () => setTopUpSimPage((p) => Math.min(topUpSimTotalPages, p + 1)),
    [setTopUpSimPage, topUpSimTotalPages]
  );

  const handleBack = useCallback(
    () => setTopUpStep((prev) => Math.max(1, prev - 1)),
    [setTopUpStep]
  );

  const handleClose = useCallback(() => setIsTopUpOpen(false), [setIsTopUpOpen]);

  return (
    <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Top Up</DialogTitle>
          <DialogDescription>
            Step {topUpStep} of 3: {stepDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2 mt-1">
          {[1, 2, 3].map((stepNumber) => (
            <div key={`topup-step-${stepNumber}`} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  topUpStep > stepNumber
                    ? 'bg-[#1f1f1f] text-white'
                    : topUpStep === stepNumber
                    ? 'bg-[#1f1f1f] text-white'
                    : 'bg-[#f3f3f3] text-[#828282]'
                }`}
              >
                {topUpStep > stepNumber ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`ml-2 text-xs ${
                  topUpStep >= stepNumber
                    ? 'text-[#1f1f1f] font-medium'
                    : 'text-[#828282]'
                }`}
              >
                {stepNumber === 1
                  ? 'Customer'
                  : stepNumber === 2
                  ? 'SIM'
                  : 'Amount'}
              </span>
              {stepNumber < 3 && (
                <div className="w-8 h-px bg-[#e5e5e5] mx-3" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {/* Step 1: Customer selection */}
          {topUpStep === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="quick-topup-customer-search">
                  Search Customer
                </Label>
                <Input
                  id="quick-topup-customer-search"
                  value={topUpCustomerSearch}
                  onChange={handleCustomerSearchChange}
                  placeholder="Search by customer name"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {paginatedTopUpCustomers.map((customer) => (
                  <button
                    key={`topup-customer-${customer.id}`}
                    type="button"
                    onClick={() => selectCustomer(customer.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      String(selectedCustomerIdForTopUp) === String(customer.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#5b93ff]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#5b93ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1f1f1f] truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-[#828282] truncate">
                        {customer.email || 'No email'} •{' '}
                        {customer.phone || 'No phone'}
                      </p>
                    </div>
                    {String(selectedCustomerIdForTopUp) === String(customer.id) && (
                      <Check className="w-5 h-5 text-[#1f1f1f]" />
                    )}
                  </button>
                ))}
                {filteredTopUpCustomers.length === 0 && (
                  <p className="text-sm text-[#828282] text-center py-4">
                    No customer found.
                  </p>
                )}
              </div>

              {filteredTopUpCustomers.length > SELECTOR_PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-[#828282]">
                  <span>
                    Showing {topUpCustomerStartIndex + 1}-
                    {Math.min(
                      topUpCustomerStartIndex + paginatedTopUpCustomers.length,
                      filteredTopUpCustomers.length
                    )}{' '}
                    of {filteredTopUpCustomers.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCustomerPrevPage}
                      disabled={safeTopUpCustomerPage === 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span>
                      {safeTopUpCustomerPage}/{topUpCustomerTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCustomerNextPage}
                      disabled={safeTopUpCustomerPage === topUpCustomerTotalPages}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: SIM selection */}
          {topUpStep === 2 && (
            <>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {paginatedTopUpSims.map((sim) => (
                  <button
                    key={`topup-sim-${sim.id}`}
                    type="button"
                    onClick={() => setSelectedSimIdForTopUp(sim.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      String(selectedSimIdForTopUp) === String(sim.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#3ebb7f]/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#3ebb7f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1f1f1f] truncate">
                        {sim.msisdn || `SIM #${sim.id}`}
                      </p>
                      <p className="text-xs text-[#828282] truncate">
                        ICCID {sim.iccid || '-'} • {sim.status}
                      </p>
                    </div>
                    {String(selectedSimIdForTopUp) === String(sim.id) && (
                      <Check className="w-5 h-5 text-[#1f1f1f]" />
                    )}
                  </button>
                ))}
                {simsByTopUpCustomer.length === 0 && (
                  <p className="text-sm text-[#828282] text-center py-4">
                    No SIM found for this customer.
                  </p>
                )}
              </div>

              {simsByTopUpCustomer.length > SELECTOR_PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-[#828282]">
                  <span>
                    Showing {topUpSimStartIndex + 1}-
                    {Math.min(
                      topUpSimStartIndex + paginatedTopUpSims.length,
                      simsByTopUpCustomer.length
                    )}{' '}
                    of {simsByTopUpCustomer.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSimPrevPage}
                      disabled={safeTopUpSimPage === 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span>
                      {safeTopUpSimPage}/{topUpSimTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSimNextPage}
                      disabled={safeTopUpSimPage === topUpSimTotalPages}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Amount */}
          {topUpStep === 3 && (
            <div className="space-y-1.5">
              <Label htmlFor="quick-topup-amount">Amount</Label>
              <Input
                id="quick-topup-amount"
                type="number"
                min="0"
                step="0.01"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="e.g. 5.00"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {topUpStep === 1 ? (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceedTopUp() || isSubmittingTopUp}
          >
            {topUpStep === 3
              ? isSubmittingTopUp
                ? 'Processing...'
                : 'Submit Top Up'
              : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

TopUpDialog.propTypes = {
  actions: PropTypes.object.isRequired,
};