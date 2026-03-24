import { useState } from 'react';
import { Phone, User, Package, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
export function SellSIMModal({ isOpen, onClose, onSell, sim, availableMSISDNs, customers, plans }) {
    const [step, setStep] = useState(1);
    const [selectedMSISDN, setSelectedMSISDN] = useState(null);
    const [customerTab, setCustomerTab] = useState('existing');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    // New customer form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        idNumber: '',
    });
      const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;
    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.toLowerCase().includes(customerSearch.toLowerCase()));
    const handleSell = () => {
        if (!sim || !selectedMSISDN || !selectedPlan)
            return;
        onSell({
            simId: sim.id,
            msisdnId: selectedMSISDN.id,
            customerId: customerTab === 'existing' ? selectedCustomer?.id || null : null,
            newCustomer: customerTab === 'new' ? newCustomer : null,
            planId: selectedPlan.id,
        });
        // Reset form
        setStep(1);
        setSelectedMSISDN(null);
        setSelectedCustomer(null);
        setSelectedPlan(null);
        setCustomerTab('existing');
        setNewCustomer({ name: '', email: '', phone: '', address: '', idNumber: '' });
        onClose();
    };
    const canProceed = () => {
        if (step === 1)
            return selectedMSISDN !== null;
        if (step === 2) {
            if (customerTab === 'existing')
                return selectedCustomer !== null;
            return newCustomer.name && newCustomer.email && newCustomer.phone && newCustomer.idNumber;
        }
        if (step === 3)
            return selectedPlan !== null;
        return false;
    };
    const handleNext = () => {
        if (step < 3)
            setStep(step + 1);
        else
            handleSell();
    };
    const handleBack = () => {
        if (step > 1)
            setStep(step - 1);
    };
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sell SIM Card</DialogTitle>
          <DialogDescription>
            Sell SIM {sim?.iccid} by assigning MSISDN, customer, and plan.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 mt-4">
          {[1, 2, 3].map((s) => (<div key={s} className="flex items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors", step >= s ? "bg-[#1f1f1f] text-white" : "bg-[#f3f3f3] text-[#828282]")}>
                {step > s ? <Check className="w-4 h-4"/> : s}
              </div>
              <span className={cn("ml-2 text-sm", step >= s ? "text-[#1f1f1f] font-medium" : "text-[#828282]")}>
                {s === 1 && 'Select MSISDN'}
                {s === 2 && 'Select Customer'}
                {s === 3 && 'Select Plan'}
              </span>
              {s < 3 && <div className="w-12 h-px bg-[#e5e5e5] mx-4"/>}
            </div>))}
        </div>

        {/* Step 1: Select MSISDN */}
        {step === 1 && (<div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#828282] mb-4">
              <Phone className="w-4 h-4"/>
              <span>Select an available MSISDN from the pool</span>
            </div>
            
            {availableMSISDNs.length === 0 ? (<div className="text-center py-8 text-[#828282]">
                <Phone className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                <p>No available MSISDNs in the pool.</p>
                <p className="text-sm">Please add MSISDNs to the inventory first.</p>
              </div>) : (<div className="grid grid-cols-2 gap-3">
                {availableMSISDNs.map((msisdn) => (<button key={msisdn.id} onClick={() => setSelectedMSISDN(msisdn)} className={cn("p-4 rounded-lg border-2 text-left transition-all", selectedMSISDN?.id === msisdn.id
                        ? "border-[#1f1f1f] bg-[#f3f3f3]"
                        : "border-[#f3f3f3] hover:border-[#c9c7c7]")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedMSISDN?.id === msisdn.id ? "bg-[#1f1f1f]" : "bg-[#3ebb7f]/10")}>
                        <Phone className={cn("w-5 h-5", selectedMSISDN?.id === msisdn.id ? "text-white" : "text-[#3ebb7f]")}/>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1f1f1f]">{msisdn.number}</p>
                        <p className="text-xs text-[#828282]">Available</p>
                      </div>
                      <p className="text-sm font-semibold text-[#1f1f1f] self-center">{formatPrice(msisdn.price)}</p>
                    </div>
                  </button>))}
              </div>)}
          </div>)}

        {/* Step 2: Select Customer */}
        {step === 2 && (<div className="space-y-4">
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
                  {filteredCustomers.map((customer) => (<button key={customer.id} onClick={() => setSelectedCustomer(customer)} className={cn("w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3", selectedCustomer?.id === customer.id
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
          </div>)}

        {/* Step 3: Select Plan */}
        {step === 3 && (<div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#828282] mb-4">
              <Package className="w-4 h-4"/>
              <span>Select a plan for the customer</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {plans.filter(p => p.active).map((plan) => (<button key={plan.id} onClick={() => setSelectedPlan(plan)} className={cn("p-4 rounded-lg border-2 text-left transition-all", selectedPlan?.id === plan.id
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
          </div>)}

        {/* Summary */}
        {step === 3 && selectedMSISDN && selectedPlan && (<div className="mt-6 p-4 bg-[#f3f3f3] rounded-lg">
            <p className="text-sm font-medium text-[#1f1f1f] mb-2">Sale Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#828282]">SIM ICCID:</span>
                <span className="font-mono">{sim?.iccid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">MSISDN:</span>
                <span>{selectedMSISDN.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">MSISDN Price:</span>
                <span>{formatPrice(selectedMSISDN.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#828282]">Customer:</span>
                <span>
                  {customerTab === 'existing'
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
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
            {step === 3 ? 'Complete Sale' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
}
