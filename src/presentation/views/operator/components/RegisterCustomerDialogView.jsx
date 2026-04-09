import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'sonner';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  address: '',
};

export const RegisterCustomerDialogView = ({ isOpen, setIsOpen, onAddCustomer }) => {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(initialFormState);

  // Basic email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
  };

  const handleCreateCustomer = async () => {
    if (!onAddCustomer || isAddingCustomer) return;

    const { name, email, phone, idNumber, address } = newCustomerForm;
    const trimmedData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      idNumber: idNumber.trim(),
      address: address.trim(),
    };

    // Required fields validation
    if (!trimmedData.name || !trimmedData.email || !trimmedData.phone || !trimmedData.idNumber) {
      toast.error('Please fill name, email, phone, and ID number');
      return;
    }

    // Email format validation
    if (!isValidEmail(trimmedData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Optional: phone number basic validation (at least 8 digits)
    const phoneDigits = trimmedData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Phone number must contain at least 8 digits');
      return;
    }

    try {
      setIsAddingCustomer(true);
      const result = await onAddCustomer(trimmedData);

      // If the parent returns false, treat as failure (error already shown by parent)
      if (result === false) return;

      toast.success('Customer registered successfully');
      setIsOpen(false);
      setNewCustomerForm(initialFormState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // Reset form when dialog closes (either by cancel, backdrop click, or ESC)
  const handleOpenChange = (open) => {
    if (!open) {
      setNewCustomerForm(initialFormState);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Customer</DialogTitle>
          <DialogDescription>Add customer details for front-desk registration.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleCreateCustomer(); }} className="space-y-3 mt-1">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Customer full name"
              disabled={isAddingCustomer}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="customer@email.com"
              disabled={isAddingCustomer}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
              disabled={isAddingCustomer}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input
              id="idNumber"
              value={newCustomerForm.idNumber}
              onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, idNumber: e.target.value }))}
              placeholder="National ID / Passport"
              disabled={isAddingCustomer}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={newCustomerForm.address}
              onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Optional address"
              disabled={isAddingCustomer}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isAddingCustomer}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90"
              disabled={isAddingCustomer || !onAddCustomer}
            >
              {isAddingCustomer ? 'Saving...' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};