import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'sonner';

export const RegisterCustomerDialogView = ({ isOpen, setIsOpen, onAddCustomer }) => {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ 
    name: '', email: '', phone: '', idNumber: '', address: '' 
  });

  const handleCreateCustomer = async () => {
    if (!onAddCustomer || isAddingCustomer) {
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
        setIsOpen(false);
        setNewCustomerForm({ name: '', email: '', phone: '', idNumber: '', address: '' });
        return true;
      }
    } finally {
      setIsAddingCustomer(false);
    }
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Customer</DialogTitle>
          <DialogDescription>Add customer details for front-desk registration.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input 
              value={newCustomerForm.name} 
              onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, name: event.target.value }))} 
              placeholder="Customer full name"
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input 
              type="email" 
              value={newCustomerForm.email} 
              onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, email: event.target.value }))} 
              placeholder="customer@email.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input 
              value={newCustomerForm.phone} 
              onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, phone: event.target.value }))} 
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-1">
            <Label>ID Number</Label>
            <Input 
              value={newCustomerForm.idNumber} 
              onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, idNumber: event.target.value }))} 
              placeholder="National ID / Passport"
            />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input 
              value={newCustomerForm.address} 
              onChange={(event) => setNewCustomerForm((prev) => ({ ...prev, address: event.target.value }))} 
              placeholder="Optional address"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isAddingCustomer}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCustomer} 
              className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90" 
              disabled={isAddingCustomer || !onAddCustomer}
            >
              {isAddingCustomer ? 'Saving...' : 'Register Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
