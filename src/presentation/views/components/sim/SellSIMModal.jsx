/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Phone, User, Package, Search, Check, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/presentation/components/ui/dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { BackButton } from '../common/BackButton';
import { cn } from '@/presentation/lib/utils';
import { ScanIccidDialog } from '@/presentation/components/ScanIccidDialog';

const normalizeSearchValue = (value) => String(value || '').toLowerCase().trim();

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

const normalizeIccid = (value) => String(value || '').replace(/\s+/g, '').trim();
export function SellSIMModal({ isOpen, onClose, onSell, onReactivate, sim, availableMSISDNs, customers, plans, preselectedMSISDN = null, availableSIMs = [], lockedCustomer = null }) {
    const [step, setStep] = useState(1);
  const [selectedMSISDN, setSelectedMSISDN] = useState(preselectedMSISDN || null);
  const [selectedSIM, setSelectedSIM] = useState(sim || null);
    const [customerTab, setCustomerTab] = useState('existing');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [msisdnSearch, setMsisdnSearch] = useState('');
    const [msisdnPriceFilter, setMsisdnPriceFilter] = useState('all');
    const [msisdnPage, setMsisdnPage] = useState(1);
    const [simSearch, setSimSearch] = useState('');
    const [simPage, setSimPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [planPage, setPlanPage] = useState(1);
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [scanFeedback, setScanFeedback] = useState('');
    // New customer form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        idNumber: '',
    });
      const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;
    const formatNumberDisplay = (value) => String(value || '').replace(/^\+855\s?/, '');
    const filteredCustomers = customers
      .map((customer) => {
        const query = normalizeSearchValue(customerSearch);
        const bestMatchScore = query
          ? Math.max(
              computeBestMatchScore(query, customer.name),
              computeBestMatchScore(query, customer.email),
              computeBestMatchScore(query, customer.phone),
            )
          : 0;

        return {
          ...customer,
          bestMatchScore,
        };
      })
      .filter((customer) => normalizeSearchValue(customerSearch).length === 0 || customer.bestMatchScore >= 0)
      .sort((first, second) => {
        const query = normalizeSearchValue(customerSearch);
        if (query.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
          return second.bestMatchScore - first.bestMatchScore;
        }
        return String(first.name || '').localeCompare(String(second.name || ''));
      });

    const hasPreselectedMSISDN = Boolean(preselectedMSISDN);
    const isLockedCustomerFlow = Boolean(lockedCustomer);
    const isReactivationFlow = Boolean(sim?.reactivate);
    const requiresIccidStep = !isReactivationFlow && !sim && !hasPreselectedMSISDN && !isLockedCustomerFlow;
    const totalSteps = isReactivationFlow ? 2 : (requiresIccidStep ? 4 : 3);
    const submitLabel = isReactivationFlow ? 'Complete Reactivation' : 'Complete Sale';

    const msisdnPriceMatches = (price, filter) => {
      const value = Number(price || 0);
      if (filter === '0-5')
        return value <= 5;
      if (filter === '5-10')
        return value > 5 && value <= 10;
      if (filter === '10-20')
        return value > 10 && value <= 20;
      if (filter === '20+')
        return value > 20;
      return true;
    };

    const filteredMSISDNs = availableMSISDNs
      .map((msisdn) => {
        const search = normalizeSearchValue(msisdnSearch);
        return {
          ...msisdn,
          bestMatchScore: search ? computeBestMatchScore(search, msisdn.number) : 0,
        };
      })
      .filter((msisdn) => {
        const search = normalizeSearchValue(msisdnSearch);
        const matchesSearch = !search || msisdn.bestMatchScore >= 0;
        const matchesPrice = msisdnPriceMatches(msisdn.price, msisdnPriceFilter);
        return matchesSearch && matchesPrice;
      })
      .sort((first, second) => {
        const search = normalizeSearchValue(msisdnSearch);
        if (search.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
          return second.bestMatchScore - first.bestMatchScore;
        }
        return String(first.number || '').localeCompare(String(second.number || ''));
      });

    const MSISDN_PAGE_SIZE = 8;
    const totalMsisdnPages = Math.max(1, Math.ceil(filteredMSISDNs.length / MSISDN_PAGE_SIZE));
    const safeMsisdnPage = Math.min(msisdnPage, totalMsisdnPages);
    const msisdnStartIndex = (safeMsisdnPage - 1) * MSISDN_PAGE_SIZE;
    const paginatedMSISDNs = filteredMSISDNs.slice(msisdnStartIndex, msisdnStartIndex + MSISDN_PAGE_SIZE);

    const filteredSelectableSIMs = availableSIMs
      .map((item) => {
        const keyword = normalizeSearchValue(simSearch);
        const bestMatchScore = keyword
          ? Math.max(
              computeBestMatchScore(keyword, item.iccid),
              computeBestMatchScore(keyword, item.id),
            )
          : 0;
        return {
          ...item,
          bestMatchScore,
        };
      })
      .filter((item) => {
        const matchesStatus = String(item.status || '').toLowerCase() === 'inactive';
        const keyword = normalizeSearchValue(simSearch);
        const matchesSearch = keyword.length === 0 || item.bestMatchScore >= 0;
        return matchesStatus && matchesSearch;
      })
      .sort((first, second) => {
        const keyword = normalizeSearchValue(simSearch);
        if (keyword.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
          return second.bestMatchScore - first.bestMatchScore;
        }
        return Number(first.id || 0) - Number(second.id || 0);
      });

    const handleAutoAssignSIM = () => {
      if (filteredSelectableSIMs.length === 0) {
        return;
      }
      setSelectedSIM(filteredSelectableSIMs[0]);
    };

    const handleScanResult = (value) => {
      const normalized = normalizeIccid(value);
      setSimSearch(normalized);
      setSimPage(1);

      const matchedSim = availableSIMs.find((item) => {
        const isInactive = String(item.status || '').toLowerCase() === 'inactive';
        return isInactive && normalizeIccid(item.iccid) === normalized;
      });

      if (matchedSim) {
        setSelectedSIM(matchedSim);
        setScanFeedback('');
        return;
      }

      setSelectedSIM(null);
      setScanFeedback('Scanned ICCID not found among inactive SIMs.');
    };

    const SIM_PAGE_SIZE = 8;
    const totalSimPages = Math.max(1, Math.ceil(filteredSelectableSIMs.length / SIM_PAGE_SIZE));
    const safeSimPage = Math.min(simPage, totalSimPages);
    const simStartIndex = (safeSimPage - 1) * SIM_PAGE_SIZE;
    const paginatedSelectableSIMs = filteredSelectableSIMs.slice(simStartIndex, simStartIndex + SIM_PAGE_SIZE);

    const CUSTOMER_PAGE_SIZE = 8;
    const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMER_PAGE_SIZE));
    const safeCustomerPage = Math.min(customerPage, totalCustomerPages);
    const customerStartIndex = (safeCustomerPage - 1) * CUSTOMER_PAGE_SIZE;
    const paginatedCustomers = filteredCustomers.slice(customerStartIndex, customerStartIndex + CUSTOMER_PAGE_SIZE);

    const activePlans = plans.filter((plan) => plan.active);
    const PLAN_PAGE_SIZE = 8;
    const totalPlanPages = Math.max(1, Math.ceil(activePlans.length / PLAN_PAGE_SIZE));
    const safePlanPage = Math.min(planPage, totalPlanPages);
    const planStartIndex = (safePlanPage - 1) * PLAN_PAGE_SIZE;
    const paginatedPlans = activePlans.slice(planStartIndex, planStartIndex + PLAN_PAGE_SIZE);

    useEffect(() => {
      if (!isOpen) {
        return;
      }
      setSelectedMSISDN(preselectedMSISDN || null);
      setSelectedSIM(sim || null);
      setStep(1);
      setMsisdnPage(1);
      setSimPage(1);
      setCustomerPage(1);
      setPlanPage(1);
      setCustomerSearch('');
      setMsisdnSearch('');
      setSimSearch('');
      if ((isReactivationFlow || isLockedCustomerFlow) && lockedCustomer) {
        setCustomerTab('existing');
        setSelectedCustomer(lockedCustomer);
      }
    }, [isOpen, preselectedMSISDN, sim]);

    useEffect(() => {
      setSimPage(1);
    }, [simSearch]);

    useEffect(() => {
      setCustomerPage(1);
    }, [customerSearch, customerTab]);

    useEffect(() => {
      setPlanPage(1);
    }, [step]);

    const handleSell = async () => {
      const resolvedSIM = (hasPreselectedMSISDN || isLockedCustomerFlow) ? selectedSIM : (sim || selectedSIM);
      const resolvedMSISDN = hasPreselectedMSISDN ? preselectedMSISDN : selectedMSISDN;
        if (!resolvedSIM || !resolvedMSISDN || !selectedPlan)
            return;
      const handler = isReactivationFlow && typeof onReactivate === 'function' ? onReactivate : onSell;

      // Determine customer id to use. For reactivation, prefer lockedCustomer, then any selected customer in modal.
      let computedCustomerId = null;
      if (isReactivationFlow) {
        computedCustomerId = lockedCustomer?.id ?? selectedCustomer?.id ?? null;
      } else if (isLockedCustomerFlow) {
        computedCustomerId = lockedCustomer?.id ?? null;
      } else {
        computedCustomerId = customerTab === 'existing' ? selectedCustomer?.id ?? null : null;
      }

      const success = await handler({
            simId: resolvedSIM.id,
            msisdnId: resolvedMSISDN.id,
            customerId: computedCustomerId,
        newCustomer: (!isReactivationFlow && !isLockedCustomerFlow && customerTab === 'new') ? newCustomer : null,
            planId: selectedPlan.id,
        });
        if (!success) {
            return;
        }
        // Reset form
        setStep(1);
        setSelectedMSISDN(preselectedMSISDN || null);
        setSelectedSIM(sim || null);
        setSelectedCustomer(null);
        setSelectedPlan(null);
        setCustomerTab('existing');
        setNewCustomer({ name: '', email: '', phone: '', address: '', idNumber: '' });
        onClose();
    };
    const canProceed = () => {
      if (step === 1) {
        if (hasPreselectedMSISDN) {
          return selectedSIM !== null;
        }
        return selectedMSISDN !== null;
      }
        if (step === 2) {
            if (isReactivationFlow) {
              return selectedPlan !== null;
            }
            if (isLockedCustomerFlow) {
              return selectedSIM !== null;
            }
            if (customerTab === 'existing')
                return selectedCustomer !== null;
            return newCustomer.name && newCustomer.email && newCustomer.phone && newCustomer.idNumber;
        }
        if (requiresIccidStep && step === 3) {
            return selectedSIM !== null;
        }
        if (step === totalSteps)
            return selectedPlan !== null;
        return false;
    };
    const handleNext = async () => {
        if (step < totalSteps)
            setStep(step + 1);
        else
            await handleSell();
    };
    const handleBack = () => {
        if (step > 1)
            setStep(step - 1);
    };
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReactivationFlow ? 'Reactivate SIM' : isLockedCustomerFlow ? 'Buy SIM' : 'Sell SIM Card'}</DialogTitle>
          <DialogDescription>
            {isReactivationFlow
            ? `Reactivate SIM ${sim?.iccid || ''} by assigning MSISDN and plan.`
            : isLockedCustomerFlow
            ? `Buy SIM for ${lockedCustomer?.name || 'customer'} by selecting number pool, ICCID, and plan.`
            : hasPreselectedMSISDN
            ? `Sell number ${preselectedMSISDN?.number || ''} by selecting ICCID, customer, and plan.`
            : sim?.iccid
            ? `Sell SIM ${sim.iccid} by assigning MSISDN, customer, and plan.`
            : 'Sell SIM by assigning MSISDN, ICCID, customer, and plan.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 mt-4">
          {Array.from({ length: totalSteps }, (_, index) => index + 1).map((s) => (<div key={s} className="flex items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step >= s ? "bg-[#1f1f1f] text-white" : "bg-[#f3f3f3] text-[#828282]")}>
                {step > s ? <Check className="w-4 h-4"/> : s}
              </div>
              <span className={cn("ml-2 text-sm", step >= s ? "text-[#1f1f1f] font-medium" : "text-[#828282]")}>
                {s === 1 && (hasPreselectedMSISDN ? 'Select ICCID' : 'Select Number')}
                {s === 2 && (isReactivationFlow ? 'Select Plan' : (isLockedCustomerFlow ? 'Select ICCID' : 'Select Customer'))}
                {requiresIccidStep && s === 3 && 'Select ICCID'}
                {s === totalSteps && !(isReactivationFlow && s === 2) && 'Select Plan'}
              </span>
              {s < totalSteps && <div className="w-12 h-px bg-[#e5e5e5] mx-4"/>}
            </div>))}
        </div>

        {/* Step 1: Select MSISDN or ICCID */}
        {step === 1 && (<div className="space-y-4">
            {hasPreselectedMSISDN ? (<>
                <div className="p-3 rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] text-sm">
                  <p className="text-[#828282]">Selected Number</p>
                  <p className="font-medium text-[#1f1f1f]">{formatNumberDisplay(preselectedMSISDN?.number)} • {formatPrice(preselectedMSISDN?.price)}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
                    <Input placeholder="Search ICCID..." value={simSearch} onChange={(e) => {
                    setSimSearch(e.target.value);
                    setScanFeedback('');
                }} className="pl-10"/>
                  </div>
                  <Button type="button" variant="outline" className="h-9" onClick={() => setIsScanOpen(true)}>
                    <Camera className="w-4 h-4 mr-2"/>
                    Scan
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleAutoAssignSIM} disabled={filteredSelectableSIMs.length === 0}>
                    Auto Assign ICCID
                  </Button>
                </div>
                {scanFeedback && <p className="text-sm text-red-600">{scanFeedback}</p>}
                {filteredSelectableSIMs.length === 0 ? (<div className="text-center py-8 text-[#828282] border border-[#f3f3f3] rounded-lg">
                    <p>No inactive ICCID available for this sale.</p>
                  </div>) : (<div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                    {paginatedSelectableSIMs.map((item) => (<button key={item.id} onClick={() => setSelectedSIM(item)} className={cn("p-3 rounded-lg border text-left transition-all", selectedSIM?.id === item.id
                          ? "border-[#1f1f1f] bg-[#f3f3f3]"
                          : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                        <p className="font-medium text-[#1f1f1f]">ICCID {item.iccid}</p>
                        <p className="text-xs text-[#828282]">SIM #{item.id} • {item.status}</p>
                      </button>))}
                  </div>)}
                {filteredSelectableSIMs.length > SIM_PAGE_SIZE && (<div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                    <span>
                      Showing {simStartIndex + 1}-{Math.min(simStartIndex + paginatedSelectableSIMs.length, filteredSelectableSIMs.length)} of {filteredSelectableSIMs.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.max(1, previous - 1))} disabled={safeSimPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safeSimPage}/{totalSimPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.min(totalSimPages, previous + 1))} disabled={safeSimPage === totalSimPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>)}
              </>) : (<>
                <div className="flex items-center gap-2 text-sm text-[#828282] mb-4">
                  <Phone className="w-4 h-4"/>
                  <span>Select number pool first</span>
                </div>

                {availableMSISDNs.length === 0 ? (<div className="text-center py-8 text-[#828282]">
                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                    <p>No available MSISDNs in the pool.</p>
                    <p className="text-sm">Please add MSISDNs to the inventory first.</p>
                  </div>) : (<>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
                        <Input placeholder="Search by MSISDN..." value={msisdnSearch} onChange={(e) => {
                        setMsisdnSearch(e.target.value);
                        setMsisdnPage(1);
                    }} className="pl-10"/>
                      </div>
                      <select value={msisdnPriceFilter} onChange={(e) => {
                        setMsisdnPriceFilter(e.target.value);
                        setMsisdnPage(1);
                    }} className="h-10 rounded-md border border-[#c9c7c7] bg-white px-3 text-sm text-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#1f1f1f]">
                        <option value="all">All Prices</option>
                        <option value="0-5">$0 - $5</option>
                        <option value="5-10">$5.01 - $10</option>
                        <option value="10-20">$10.01 - $20</option>
                        <option value="20+">$20+</option>
                      </select>
                    </div>

                    {filteredMSISDNs.length === 0 ? (<div className="text-center py-8 text-[#828282] border border-[#f3f3f3] rounded-lg">
                        <p>No MSISDN matches your search/filter.</p>
                      </div>) : (<>
                        <div className="grid grid-cols-2 gap-3">
                    {paginatedMSISDNs.map((msisdn) => (<button key={msisdn.id} onClick={() => {
                        setSelectedMSISDN(msisdn);
                        if (!isReactivationFlow) {
                          setSelectedSIM(null);
                        }
                      }} className={cn("p-4 rounded-lg border-2 text-left transition-all", selectedMSISDN?.id === msisdn.id
                            ? "border-[#1f1f1f] bg-[#f3f3f3]"
                            : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                        <div className="flex items-center justify-between gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedMSISDN?.id === msisdn.id ? "bg-[#1f1f1f]" : "bg-[#3ebb7f]/10")}>
                            <Phone className={cn("w-5 h-5", selectedMSISDN?.id === msisdn.id ? "text-white" : "text-[#3ebb7f]")}/>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#1f1f1f]">{formatNumberDisplay(msisdn.number)}</p>
                            <p className="text-xs text-[#828282]">Available</p>
                          </div>
                          <p className="text-sm font-semibold text-[#1f1f1f] self-center">{formatPrice(msisdn.price)}</p>
                        </div>
                      </button>))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                          <span>
                            Showing {filteredMSISDNs.length === 0 ? 0 : msisdnStartIndex + 1}-{Math.min(msisdnStartIndex + paginatedMSISDNs.length, filteredMSISDNs.length)} of {filteredMSISDNs.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setMsisdnPage((prev) => Math.max(1, prev - 1))} disabled={safeMsisdnPage === 1}>
                              <ChevronLeft className="w-3 h-3"/>
                            </Button>
                            <span>{safeMsisdnPage}/{totalMsisdnPages}</span>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setMsisdnPage((prev) => Math.min(totalMsisdnPages, prev + 1))} disabled={safeMsisdnPage === totalMsisdnPages}>
                              <ChevronRight className="w-3 h-3"/>
                            </Button>
                          </div>
                        </div>

                      </>)}
                  </>)}
              </>)}
          </div>)}

        {/* Step 2: Select ICCID or Customer */}
        {step === 2 && !isReactivationFlow && (<div className="space-y-4">
            {isLockedCustomerFlow ? (<>
              {selectedMSISDN && (<div className="p-3 rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] text-sm">
                    <p className="text-[#828282]">Selected Number</p>
                    <p className="font-medium text-[#1f1f1f]">{formatNumberDisplay(selectedMSISDN.number)} • {formatPrice(selectedMSISDN.price)}</p>
                  </div>)}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
                    <Input placeholder="Search ICCID..." value={simSearch} onChange={(e) => {
                    setSimSearch(e.target.value);
                    setScanFeedback('');
                }} className="pl-10"/>
                  </div>
                  <Button type="button" variant="outline" className="h-9" onClick={() => setIsScanOpen(true)}>
                    <Camera className="w-4 h-4 mr-2"/>
                    Scan
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleAutoAssignSIM} disabled={filteredSelectableSIMs.length === 0}>
                    Auto Assign ICCID
                  </Button>
                </div>
                {scanFeedback && <p className="text-sm text-red-600">{scanFeedback}</p>}
                {filteredSelectableSIMs.length === 0 ? (<div className="text-center py-8 text-[#828282] border border-[#f3f3f3] rounded-lg">
                    <p>No inactive ICCID available for this sale.</p>
                  </div>) : (<div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                    {paginatedSelectableSIMs.map((item) => (<button key={item.id} onClick={() => setSelectedSIM(item)} className={cn("p-3 rounded-lg border text-left transition-all", selectedSIM?.id === item.id
                          ? "border-[#1f1f1f] bg-[#f3f3f3]"
                          : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                        <p className="font-medium text-[#1f1f1f]">ICCID {item.iccid}</p>
                        <p className="text-xs text-[#828282]">SIM #{item.id} • {item.status}</p>
                      </button>))}
                  </div>)}
                {filteredSelectableSIMs.length > SIM_PAGE_SIZE && (<div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                    <span>
                      Showing {simStartIndex + 1}-{Math.min(simStartIndex + paginatedSelectableSIMs.length, filteredSelectableSIMs.length)} of {filteredSelectableSIMs.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.max(1, previous - 1))} disabled={safeSimPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safeSimPage}/{totalSimPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.min(totalSimPages, previous + 1))} disabled={safeSimPage === totalSimPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>)}
              </>) : (
            <Tabs value={customerTab} onValueChange={(v) => setCustomerTab(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                <TabsTrigger value="new">New Customer</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
                  <Input placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-10"/>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {paginatedCustomers.map((customer) => (<button key={customer.id} onClick={() => setSelectedCustomer(customer)} className={cn("w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3", selectedCustomer?.id === customer.id
                    ? "border-[#1f1f1f] bg-[#f3f3f3]"
                    : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                      <div className="w-10 h-10 rounded-full bg-[#5b93ff]/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#5b93ff]"/>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1f1f1f]">{customer.name}</p>
                        <p className="text-xs text-[#828282]">{customer.email} • {customer.phone}</p>
                      </div>
                      {selectedCustomer?.id === customer.id && (<Check className="w-5 h-5 text-[#1f1f1f]"/>)}
                    </button>))}
                </div>
                {filteredCustomers.length > CUSTOMER_PAGE_SIZE && (<div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                    <span>
                      Showing {customerStartIndex + 1}-{Math.min(customerStartIndex + paginatedCustomers.length, filteredCustomers.length)} of {filteredCustomers.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setCustomerPage((previous) => Math.max(1, previous - 1))} disabled={safeCustomerPage === 1}>
                        <ChevronLeft className="w-3 h-3"/>
                      </Button>
                      <span>{safeCustomerPage}/{totalCustomerPages}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setCustomerPage((previous) => Math.min(totalCustomerPages, previous + 1))} disabled={safeCustomerPage === totalCustomerPages}>
                        <ChevronRight className="w-3 h-3"/>
                      </Button>
                    </div>
                  </div>)}
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input placeholder="John Doe" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="john@email.com" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input placeholder="+1-555-0000" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}/>
                  </div>
                  <div className="space-y-2">
                    <Label>ID/Passport Number *</Label>
                    <Input placeholder="ID123456789" value={newCustomer.idNumber} onChange={(e) => setNewCustomer({ ...newCustomer, idNumber: e.target.value })}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="123 Main St, City, State 00000" value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}/>
                </div>
              </TabsContent>
            </Tabs>
            )}
          </div>)}

        {requiresIccidStep && step === 3 && (<div className="space-y-4">
            <div className="p-3 rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] text-sm">
              <p className="text-[#828282]">Selected Number</p>
              <p className="font-medium text-[#1f1f1f]">{formatNumberDisplay(selectedMSISDN?.number)} • {formatPrice(selectedMSISDN?.price)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]"/>
                <Input placeholder="Search ICCID..." value={simSearch} onChange={(e) => {
                setSimSearch(e.target.value);
                setScanFeedback('');
              }} className="pl-10"/>
              </div>
              <Button type="button" variant="outline" className="h-9" onClick={() => setIsScanOpen(true)}>
                <Camera className="w-4 h-4 mr-2"/>
                Scan
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleAutoAssignSIM} disabled={filteredSelectableSIMs.length === 0}>
                Auto Assign ICCID
              </Button>
            </div>
            {scanFeedback && <p className="text-sm text-red-600">{scanFeedback}</p>}
            {filteredSelectableSIMs.length === 0 ? (<div className="text-center py-8 text-[#828282] border border-[#f3f3f3] rounded-lg">
                <p>No inactive ICCID available for this sale.</p>
              </div>) : (<div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {paginatedSelectableSIMs.map((item) => (<button key={item.id} onClick={() => setSelectedSIM(item)} className={cn("p-3 rounded-lg border text-left transition-all", selectedSIM?.id === item.id
                      ? "border-[#1f1f1f] bg-[#f3f3f3]"
                      : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                    <p className="font-medium text-[#1f1f1f]">ICCID {item.iccid}</p>
                    <p className="text-xs text-[#828282]">SIM #{item.id} • {item.status}</p>
                  </button>))}
              </div>)}
            {filteredSelectableSIMs.length > SIM_PAGE_SIZE && (<div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                <span>
                  Showing {simStartIndex + 1}-{Math.min(simStartIndex + paginatedSelectableSIMs.length, filteredSelectableSIMs.length)} of {filteredSelectableSIMs.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.max(1, previous - 1))} disabled={safeSimPage === 1}>
                    <ChevronLeft className="w-3 h-3"/>
                  </Button>
                  <span>{safeSimPage}/{totalSimPages}</span>
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setSimPage((previous) => Math.min(totalSimPages, previous + 1))} disabled={safeSimPage === totalSimPages}>
                    <ChevronRight className="w-3 h-3"/>
                  </Button>
                </div>
              </div>)}
          </div>)}

        {/* Step 3: Select Plan */}
        {step === totalSteps && (<div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#828282] mb-4">
              <Package className="w-4 h-4"/>
              <span>Select a plan for the customer</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {paginatedPlans.map((plan) => (<button key={plan.id} onClick={() => setSelectedPlan(plan)} className={cn("p-4 rounded-lg border-2 text-left transition-all", selectedPlan?.id === plan.id
                    ? "border-[#1f1f1f] bg-[#f3f3f3]"
                    : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedPlan?.id === plan.id ? "bg-[#1f1f1f]" : "bg-[#f6a94c]/10")}>
                        <Package className={cn("w-5 h-5", selectedPlan?.id === plan.id ? "text-white" : "text-[#f6a94c]")}/>
                      </div>
                      <div>
                        <p className="font-medium text-[#1f1f1f]">{plan.name}</p>
                        <p className="text-xs text-[#828282]">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#1f1f1f]">${plan.price}/mo</p>
                      <p className="text-xs text-[#828282]">{plan.dataLimit} • {plan.voiceLimit}</p>
                    </div>
                  </div>
                </button>))}
            </div>
            {activePlans.length > PLAN_PAGE_SIZE && (<div className="flex items-center justify-between text-xs text-[#828282] pt-1">
                <span>
                  Showing {planStartIndex + 1}-{Math.min(planStartIndex + paginatedPlans.length, activePlans.length)} of {activePlans.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanPage((previous) => Math.max(1, previous - 1))} disabled={safePlanPage === 1}>
                    <ChevronLeft className="w-3 h-3"/>
                  </Button>
                  <span>{safePlanPage}/{totalPlanPages}</span>
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setPlanPage((previous) => Math.min(totalPlanPages, previous + 1))} disabled={safePlanPage === totalPlanPages}>
                    <ChevronRight className="w-3 h-3"/>
                  </Button>
                </div>
              </div>)}
          </div>)}

        {/* Summary */}
        {step === totalSteps && ((hasPreselectedMSISDN || isLockedCustomerFlow || !sim) ? selectedSIM : sim) && (hasPreselectedMSISDN ? preselectedMSISDN : selectedMSISDN) && selectedPlan && (<div className="mt-6 p-4 bg-[#f3f3f3] rounded-lg">
          <p className="text-sm font-medium text-[#1f1f1f] mb-2">{isReactivationFlow ? 'Reactivation Summary' : 'Sale Summary'}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#828282]">SIM ICCID:</span>
                <span className="font-mono">{(hasPreselectedMSISDN || isLockedCustomerFlow) ? selectedSIM?.iccid : (sim?.iccid || selectedSIM?.iccid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">MSISDN:</span>
                <span>{formatNumberDisplay(hasPreselectedMSISDN ? preselectedMSISDN?.number : selectedMSISDN.number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">MSISDN Price:</span>
                <span>{formatPrice(hasPreselectedMSISDN ? preselectedMSISDN?.price : selectedMSISDN.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">Customer:</span>
                <span>
                  {isReactivationFlow
                ? lockedCustomer?.name
                : isLockedCustomerFlow
                ? lockedCustomer?.name
                : customerTab === 'existing'
                ? selectedCustomer?.name
                : newCustomer.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">Plan:</span>
                <span>{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#e5e5e5] mt-2">
                <span className="text-[#828282]">Monthly Cost:</span>
                <span className="font-semibold">${selectedPlan.price}</span>
              </div>
            </div>
          </div>)}

        {/* Actions */}
        <div className="flex justify-between pt-4 mt-4 border-t border-[#f3f3f3]">
          {step === 1 ? (<Button variant="outline" onClick={onClose}>Cancel</Button>) : (<BackButton onClick={handleBack} label="Back"/>) }
          <Button onClick={handleNext} disabled={!canProceed()} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            {step === totalSteps ? submitLabel : 'Next'}
          </Button>
        </div>
      </DialogContent>
      <ScanIccidDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScan={handleScanResult}
      />
    </Dialog>);
}


