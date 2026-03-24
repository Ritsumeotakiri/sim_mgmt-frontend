import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
const statuses = ['active', 'pending', 'suspended', 'inactive'];
export function SIMFormModal({ isOpen, onClose, onSave, sim }) {
    const [formData, setFormData] = useState({
        iccid: '',
        status: 'inactive',
    });
    useEffect(() => {
        if (sim) {
            setFormData({
                iccid: sim.iccid,
                status: sim.status,
            });
        }
        else {
            setFormData({
                iccid: '',
                status: 'inactive',
            });
        }
    }, [sim, isOpen]);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sim ? 'Edit SIM Card' : 'Add New SIM Card'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="iccid">ICCID (SIM Card Number)</Label>
            <Input id="iccid" placeholder="8901234567890123456" value={formData.iccid} onChange={(e) => handleChange('iccid', e.target.value)} className="font-mono" required disabled={!!sim} // Can't edit ICCID after creation
    />
            <p className="text-xs text-[#828282]">
              The ICCID is the unique identifier printed on the SIM card.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status"/>
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (<SelectItem key={status} value={status}>
                    <span className="capitalize">{status}</span>
                  </SelectItem>))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#828282]">
              Inactive SIMs can be sold to customers. Active SIMs are in use.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
              {sim ? 'Save Changes' : 'Add SIM'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
