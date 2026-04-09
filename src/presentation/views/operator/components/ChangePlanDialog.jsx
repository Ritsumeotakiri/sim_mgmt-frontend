import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Check, ChevronLeft, ChevronRight, User, Phone, Package } from 'lucide-react';
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

export const ChangePlanDialog = ({ actions }) => {
  
    const {
  isChangePlanOpen,
  setIsChangePlanOpen,
  changePlanStep,
  setChangePlanStep,
  selectedCustomerIdForPlan,
  setSelectedCustomerIdForPlan,
  planCustomerSearch,
  setPlanCustomerSearch,
  selectedSimIdForPlan,
  setSelectedSimIdForPlan,
  selectedPlanId,
  setSelectedPlanId,
  isSubmittingPlan,
  activeSimsByPlanCustomer,
  filteredPlanCustomers,
  SELECTOR_PAGE_SIZE,
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
  canProceedChangePlan,
  handleChangePlanNext,
  setPlanCustomerPage,
  setPlanSimPage,
  setPlanListPage,
  plans,
} = actions;

  const stepDescription = useMemo(() => {
    switch (changePlanStep) {
      case 1:
        return 'Select a customer';
      case 2:
        return 'Choose a SIM card';
      case 3:
        return 'Select a new plan';
      default:
        return '';
    }
  }, [changePlanStep]);

  const handleNext = useCallback(async () => {
    const isSubmitting = changePlanStep === 3;
    try {
      await handleChangePlanNext();
      if (isSubmitting) {
        toast.success('Plan changed successfully');
      }
    } catch (error) {
      toast.error(error?.message || 'Change plan failed');
    }
  }, [handleChangePlanNext, changePlanStep]);

  const handleCustomerSearchChange = useCallback(
    (e) => {
      setPlanCustomerSearch(e.target.value);
      setPlanCustomerPage(1);
    },
    [setPlanCustomerSearch, setPlanCustomerPage]
  );

  const selectCustomer = useCallback(
    (customerId) => {
      setSelectedCustomerIdForPlan(customerId);
      setSelectedSimIdForPlan('');
      setPlanSimPage(1);
    },
    [setSelectedCustomerIdForPlan, setSelectedSimIdForPlan, setPlanSimPage]
  );

  const handleCustomerPrevPage = useCallback(
    () => setPlanCustomerPage((p) => Math.max(1, p - 1)),
    [setPlanCustomerPage]
  );
  const handleCustomerNextPage = useCallback(
    () => setPlanCustomerPage((p) => Math.min(planCustomerTotalPages, p + 1)),
    [setPlanCustomerPage, planCustomerTotalPages]
  );

  const handleSimPrevPage = useCallback(
    () => setPlanSimPage((p) => Math.max(1, p - 1)),
    [setPlanSimPage]
  );
  const handleSimNextPage = useCallback(
    () => setPlanSimPage((p) => Math.min(planSimTotalPages, p + 1)),
    [setPlanSimPage, planSimTotalPages]
  );

  const handlePlanPrevPage = useCallback(
    () => setPlanListPage((p) => Math.max(1, p - 1)),
    [setPlanListPage]
  );
  const handlePlanNextPage = useCallback(
    () => setPlanListPage((p) => Math.min(planTotalPages, p + 1)),
    [setPlanListPage, planTotalPages]
  );

  const handleBack = useCallback(
    () => setChangePlanStep((prev) => Math.max(1, prev - 1)),
    [setChangePlanStep]
  );

  const handleClose = useCallback(() => setIsChangePlanOpen(false), [setIsChangePlanOpen]);

  return (
    <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Change Plan</DialogTitle>
          <DialogDescription>
            Step {changePlanStep} of 3: {stepDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-2 mt-1">
          {[1, 2, 3].map((stepNumber) => (
            <div key={`plan-step-${stepNumber}`} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  changePlanStep > stepNumber
                    ? 'bg-[#1f1f1f] text-white'
                    : changePlanStep === stepNumber
                    ? 'bg-[#1f1f1f] text-white'
                    : 'bg-[#f3f3f3] text-[#828282]'
                }`}
              >
                {changePlanStep > stepNumber ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`ml-2 text-xs ${
                  changePlanStep >= stepNumber
                    ? 'text-[#1f1f1f] font-medium'
                    : 'text-[#828282]'
                }`}
              >
                {stepNumber === 1
                  ? 'Customer'
                  : stepNumber === 2
                  ? 'SIM'
                  : 'Plan'}
              </span>
              {stepNumber < 3 && (
                <div className="w-8 h-px bg-[#e5e5e5] mx-3" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {/* Step 1: Customer selection */}
          {changePlanStep === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="quick-plan-customer-search">
                  Search Customer
                </Label>
                <Input
                  id="quick-plan-customer-search"
                  value={planCustomerSearch}
                  onChange={handleCustomerSearchChange}
                  placeholder="Search by customer name"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {paginatedPlanCustomers.map((customer) => (
                  <button
                    key={`plan-customer-${customer.id}`}
                    type="button"
                    onClick={() => selectCustomer(customer.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      String(selectedCustomerIdForPlan) === String(customer.id)
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
                    {String(selectedCustomerIdForPlan) === String(customer.id) && (
                      <Check className="w-5 h-5 text-[#1f1f1f]" />
                    )}
                  </button>
                ))}
                {filteredPlanCustomers.length === 0 && (
                  <p className="text-sm text-[#828282] text-center py-4">
                    No customer found.
                  </p>
                )}
              </div>

              {filteredPlanCustomers.length > SELECTOR_PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-[#828282]">
                  <span>
                    Showing {planCustomerStartIndex + 1}-
                    {Math.min(
                      planCustomerStartIndex + paginatedPlanCustomers.length,
                      filteredPlanCustomers.length
                    )}{' '}
                    of {filteredPlanCustomers.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCustomerPrevPage}
                      disabled={safePlanCustomerPage === 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span>
                      {safePlanCustomerPage}/{planCustomerTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCustomerNextPage}
                      disabled={safePlanCustomerPage === planCustomerTotalPages}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: SIM selection */}
          {changePlanStep === 2 && (
            <>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {paginatedPlanSims.map((sim) => (
                  <button
                    key={`plan-sim-${sim.id}`}
                    type="button"
                    onClick={() => setSelectedSimIdForPlan(sim.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      String(selectedSimIdForPlan) === String(sim.id)
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
                        ICCID {sim.iccid || '-'} • current plan{' '}
                        {sim.planId || 'none'}
                      </p>
                    </div>
                    {String(selectedSimIdForPlan) === String(sim.id) && (
                      <Check className="w-5 h-5 text-[#1f1f1f]" />
                    )}
                  </button>
                ))}
                {activeSimsByPlanCustomer.length === 0 && (
                  <p className="text-sm text-[#828282] text-center py-4">
                    No active SIM found for this customer.
                  </p>
                )}
              </div>

              {activeSimsByPlanCustomer.length > SELECTOR_PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-[#828282]">
                  <span>
                    Showing {planSimStartIndex + 1}-
                    {Math.min(
                      planSimStartIndex + paginatedPlanSims.length,
                      activeSimsByPlanCustomer.length
                    )}{' '}
                    of {activeSimsByPlanCustomer.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSimPrevPage}
                      disabled={safePlanSimPage === 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span>
                      {safePlanSimPage}/{planSimTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSimNextPage}
                      disabled={safePlanSimPage === planSimTotalPages}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Plan selection */}
          {changePlanStep === 3 && (
            <>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {paginatedPlans.map((plan) => (
                  <button
                    key={`target-plan-${plan.id}`}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      String(selectedPlanId) === String(plan.id)
                        ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                        : 'border-[#f3f3f3] hover:border-[#c9c7c7]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#f6a94c]/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#f6a94c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1f1f1f] truncate">
                        {plan.name}
                      </p>
                      <p className="text-xs text-[#828282] truncate">
                        ${Number(plan.price || 0).toFixed(2)}
                      </p>
                    </div>
                    {String(selectedPlanId) === String(plan.id) && (
                      <Check className="w-5 h-5 text-[#1f1f1f]" />
                    )}
                  </button>
                ))}
                {(plans?.length ?? 0) === 0 && (
                  <p className="text-sm text-[#828282] text-center py-4">
                    No plan found.
                  </p>
                )}
              </div>

              {(plans?.length ?? 0) > SELECTOR_PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-[#828282]">
                  <span>
                    Showing {planListStartIndex + 1}-
                    {Math.min(
                      planListStartIndex + (paginatedPlans?.length ?? 0),
                      plans?.length ?? 0
                    )}{' '}
                    of {plans?.length ?? 0}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handlePlanPrevPage}
                      disabled={safePlanListPage === 1}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span>
                      {safePlanListPage}/{planTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handlePlanNextPage}
                      disabled={safePlanListPage === planTotalPages}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {changePlanStep === 1 ? (
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
            disabled={!canProceedChangePlan() || isSubmittingPlan}
          >
            {changePlanStep === 3
              ? isSubmittingPlan
                ? 'Updating...'
                : 'Submit Plan Change'
              : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ChangePlanDialog.propTypes = {
  actions: PropTypes.object.isRequired,
};