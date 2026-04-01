import { useMemo, useState } from 'react';
import { customerMatchesName } from '@/domain/entities/customerEntity';
import { belongsToCustomer, isActiveSim } from '@/domain/entities/simEntity';
import { isValidAmount, parseAmount } from '@/domain/entities/transactionEntity';

export function useFrontDeskActionsViewModel({ customers, sims, plans, onOpenSaleAction, onSubmitTopUpAction, onSubmitChangePlanAction }) {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [selectedCustomerIdForTopUp, setSelectedCustomerIdForTopUp] = useState('');
  const [topUpCustomerSearch, setTopUpCustomerSearch] = useState('');
  const [selectedSimIdForTopUp, setSelectedSimIdForTopUp] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpStep, setTopUpStep] = useState(1);
  const [topUpCustomerPage, setTopUpCustomerPage] = useState(1);
  const [topUpSimPage, setTopUpSimPage] = useState(1);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
  const [selectedCustomerIdForPlan, setSelectedCustomerIdForPlan] = useState('');
  const [planCustomerSearch, setPlanCustomerSearch] = useState('');
  const [selectedSimIdForPlan, setSelectedSimIdForPlan] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [changePlanStep, setChangePlanStep] = useState(1);
  const [planCustomerPage, setPlanCustomerPage] = useState(1);
  const [planSimPage, setPlanSimPage] = useState(1);
  const [planListPage, setPlanListPage] = useState(1);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const simsByTopUpCustomer = useMemo(() => {
    if (!selectedCustomerIdForTopUp) {
      return [];
    }
    return sims.filter((sim) => belongsToCustomer(sim, selectedCustomerIdForTopUp));
  }, [selectedCustomerIdForTopUp, sims]);

  const filteredTopUpCustomers = useMemo(() => {
    return customers.filter((customer) => customerMatchesName(customer, topUpCustomerSearch));
  }, [customers, topUpCustomerSearch]);

  const activeSimsByPlanCustomer = useMemo(() => {
    if (!selectedCustomerIdForPlan) {
      return [];
    }
    return sims.filter((sim) => belongsToCustomer(sim, selectedCustomerIdForPlan) && isActiveSim(sim));
  }, [selectedCustomerIdForPlan, sims]);

  const filteredPlanCustomers = useMemo(() => {
    return customers.filter((customer) => customerMatchesName(customer, planCustomerSearch));
  }, [customers, planCustomerSearch]);

  const SELECTOR_PAGE_SIZE = 6;

  const topUpCustomerTotalPages = Math.max(1, Math.ceil(filteredTopUpCustomers.length / SELECTOR_PAGE_SIZE));
  const safeTopUpCustomerPage = Math.min(topUpCustomerPage, topUpCustomerTotalPages);
  const topUpCustomerStartIndex = (safeTopUpCustomerPage - 1) * SELECTOR_PAGE_SIZE;
  const paginatedTopUpCustomers = filteredTopUpCustomers.slice(topUpCustomerStartIndex, topUpCustomerStartIndex + SELECTOR_PAGE_SIZE);

  const topUpSimTotalPages = Math.max(1, Math.ceil(simsByTopUpCustomer.length / SELECTOR_PAGE_SIZE));
  const safeTopUpSimPage = Math.min(topUpSimPage, topUpSimTotalPages);
  const topUpSimStartIndex = (safeTopUpSimPage - 1) * SELECTOR_PAGE_SIZE;
  const paginatedTopUpSims = simsByTopUpCustomer.slice(topUpSimStartIndex, topUpSimStartIndex + SELECTOR_PAGE_SIZE);

  const planCustomerTotalPages = Math.max(1, Math.ceil(filteredPlanCustomers.length / SELECTOR_PAGE_SIZE));
  const safePlanCustomerPage = Math.min(planCustomerPage, planCustomerTotalPages);
  const planCustomerStartIndex = (safePlanCustomerPage - 1) * SELECTOR_PAGE_SIZE;
  const paginatedPlanCustomers = filteredPlanCustomers.slice(planCustomerStartIndex, planCustomerStartIndex + SELECTOR_PAGE_SIZE);

  const planSimTotalPages = Math.max(1, Math.ceil(activeSimsByPlanCustomer.length / SELECTOR_PAGE_SIZE));
  const safePlanSimPage = Math.min(planSimPage, planSimTotalPages);
  const planSimStartIndex = (safePlanSimPage - 1) * SELECTOR_PAGE_SIZE;
  const paginatedPlanSims = activeSimsByPlanCustomer.slice(planSimStartIndex, planSimStartIndex + SELECTOR_PAGE_SIZE);

  const planTotalPages = Math.max(1, Math.ceil(plans.length / SELECTOR_PAGE_SIZE));
  const safePlanListPage = Math.min(planListPage, planTotalPages);
  const planListStartIndex = (safePlanListPage - 1) * SELECTOR_PAGE_SIZE;
  const paginatedPlans = plans.slice(planListStartIndex, planListStartIndex + SELECTOR_PAGE_SIZE);

  const handleQuickSale = () => {
    if (typeof onOpenSaleAction === 'function') {
      onOpenSaleAction();
    }
  };

  const openTopUpDialog = () => {
    setTopUpCustomerSearch('');
    setSelectedCustomerIdForTopUp('');
    setSelectedSimIdForTopUp('');
    setTopUpAmount('');
    setTopUpStep(1);
    setTopUpCustomerPage(1);
    setTopUpSimPage(1);
    setIsTopUpOpen(true);
  };

  const openChangePlanDialog = () => {
    setPlanCustomerSearch('');
    setSelectedCustomerIdForPlan('');
    setSelectedSimIdForPlan('');
    setSelectedPlanId('');
    setChangePlanStep(1);
    setPlanCustomerPage(1);
    setPlanSimPage(1);
    setPlanListPage(1);
    setIsChangePlanOpen(true);
  };

  const handleSubmitTopUp = async () => {
    if (!selectedCustomerIdForTopUp || !selectedSimIdForTopUp || !isValidAmount(topUpAmount)) {
      throw new Error('Please select customer, SIM, and valid amount');
    }

    if (typeof onSubmitTopUpAction !== 'function') {
      throw new Error('Top-up action is not available');
    }

    setIsSubmittingTopUp(true);
    try {
      await onSubmitTopUpAction({
        customerId: selectedCustomerIdForTopUp,
        simId: selectedSimIdForTopUp,
        amount: parseAmount(topUpAmount),
      });

      setIsTopUpOpen(false);
      setSelectedCustomerIdForTopUp('');
      setSelectedSimIdForTopUp('');
      setTopUpAmount('');
      setTopUpStep(1);
      setTopUpCustomerPage(1);
      setTopUpSimPage(1);
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handleSubmitChangePlan = async () => {
    if (!selectedCustomerIdForPlan || !selectedSimIdForPlan || !selectedPlanId) {
      throw new Error('Please select customer, active SIM, and plan');
    }

    if (typeof onSubmitChangePlanAction !== 'function') {
      throw new Error('Change plan action is not available');
    }

    setIsSubmittingPlan(true);
    try {
      await onSubmitChangePlanAction({
        customerId: selectedCustomerIdForPlan,
        simId: selectedSimIdForPlan,
        planId: selectedPlanId,
      });

      setIsChangePlanOpen(false);
      setSelectedCustomerIdForPlan('');
      setSelectedSimIdForPlan('');
      setSelectedPlanId('');
      setChangePlanStep(1);
      setPlanCustomerPage(1);
      setPlanSimPage(1);
      setPlanListPage(1);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const canProceedTopUp = () => {
    if (topUpStep === 1) {
      return Boolean(selectedCustomerIdForTopUp);
    }
    if (topUpStep === 2) {
      return Boolean(selectedSimIdForTopUp);
    }
    return isValidAmount(topUpAmount);
  };

  const canProceedChangePlan = () => {
    if (changePlanStep === 1) {
      return Boolean(selectedCustomerIdForPlan);
    }
    if (changePlanStep === 2) {
      return Boolean(selectedSimIdForPlan);
    }
    return Boolean(selectedPlanId);
  };

  const handleTopUpNext = async () => {
    if (topUpStep < 3) {
      setTopUpStep((previous) => previous + 1);
      return;
    }
    await handleSubmitTopUp();
  };

  const handleChangePlanNext = async () => {
    if (changePlanStep < 3) {
      setChangePlanStep((previous) => previous + 1);
      return;
    }
    await handleSubmitChangePlan();
  };

  return {
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
    topUpCustomerPage,
    setTopUpCustomerPage,
    topUpSimPage,
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
    planCustomerPage,
    setPlanCustomerPage,
    planSimPage,
    setPlanSimPage,
    planListPage,
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
  };
}
