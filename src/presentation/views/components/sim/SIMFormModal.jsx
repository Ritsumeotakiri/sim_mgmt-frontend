import { useState, useEffect } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/presentation/components/ui/dialog';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/presentation/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { ENDPOINTS } from '@/data/services/endpoints';
import { apiRequestWithMeta } from '@/data/services/backendApi/client';
import { ScanIccidDialog } from '@/presentation/components/ScanIccidDialog';
const statuses = ['active', 'inactive', 'suspend', 'deactivate'];
const batchStatuses = ['inactive', 'active', 'suspend', 'deactivate'];
export function SIMFormModal({ isOpen, onClose, onSave, onBatchImport, sim }) {
    const [formData, setFormData] = useState({
        iccid: '',
        status: 'inactive',
        branchId: 'none',
    });
    const [isScanOpen, setIsScanOpen] = useState(false);
  const [importMode, setImportMode] = useState('single');
  const [batchStatus, setBatchStatus] = useState('inactive');
  const [batchBranchId, setBatchBranchId] = useState('none');
  const [batchFile, setBatchFile] = useState(null);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [branches, setBranches] = useState([]);
    useEffect(() => {
        if (sim) {
            setFormData({
                iccid: sim.iccid,
                status: sim.status,
              branchId: sim.branchId || 'none',
            });
        }
        else {
            setFormData({
                iccid: '',
                status: 'inactive',
              branchId: 'none',
            });
              setImportMode('single');
              setBatchStatus('inactive');
              setBatchBranchId('none');
              setBatchFile(null);
        }
    }, [sim, isOpen]);
        useEffect(() => {
          const loadBranches = async () => {
            const response = await apiRequestWithMeta(`${ENDPOINTS.branches.list}?page=1&pageSize=200`);
            setBranches((response.data || []).map((branch) => ({ id: String(branch.id ?? branch.branch_id), name: branch.name })));
          };
          loadBranches();
        }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await onSave(formData);
        if (result !== false) {
            onClose();
        }
    };
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const handleBatchSubmit = async (event) => {
        event.preventDefault();
        if (!batchFile || !onBatchImport) {
            return;
        }
        setIsSubmittingBatch(true);
        try {
            const result = await onBatchImport({
                file: batchFile,
                status: batchStatus,
              branchId: batchBranchId !== 'none' ? batchBranchId : null,
            });
            if (result !== false) {
                onClose();
            }
        }
        finally {
            setIsSubmittingBatch(false);
        }
    };
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sim ? 'Edit SIM Card' : 'Add New SIM Card'}</DialogTitle>
        </DialogHeader>

        {sim ? (<form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="iccid">ICCID (SIM Card Number)</Label>
              <Input id="iccid" placeholder="8901234567890123456" value={formData.iccid} onChange={(e) => handleChange('iccid', e.target.value)} className="font-mono" required disabled={!!sim}/>
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
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formData.branchId} onValueChange={(value) => handleChange('branchId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No branch</SelectItem>
                  {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                Save Changes
              </Button>
            </div>
          </form>) : (<Tabs value={importMode} onValueChange={setImportMode} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single SIM</TabsTrigger>
              <TabsTrigger value="batch">Excel Batch</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="iccid">ICCID (SIM Card Number)</Label>
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setIsScanOpen(true)}>
                      Scan
                    </Button>
                  </div>
                  <Input id="iccid" placeholder="8901234567890123456" value={formData.iccid} onChange={(e) => handleChange('iccid', e.target.value)} className="font-mono" required/>
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

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={formData.branchId} onValueChange={(value) => handleChange('branchId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No branch</SelectItem>
                      {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                    Add SIM
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4 mt-4">
              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchFile">Excel File (.xlsx)</Label>
                  <Input id="batchFile" type="file" accept=".xlsx" onChange={(e) => setBatchFile(e.target.files?.[0] || null)} required/>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchStatus">Default Status</Label>
                  <Select value={batchStatus} onValueChange={setBatchStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select default status"/>
                    </SelectTrigger>
                    <SelectContent>
                      {batchStatuses.map((status) => (<SelectItem key={status} value={status}>
                          <span className="capitalize">{status}</span>
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={batchBranchId} onValueChange={setBatchBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No branch</SelectItem>
                      {branches.map((branch) => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-[#f3f3f3] p-3">
                  <p className="text-sm font-medium text-[#1f1f1f] mb-2">Excel format sample</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-[#f3f3f3]">
                      <thead>
                        <tr className="bg-[#f9f9f9]">
                          <th className="px-3 py-2 text-left border-b border-[#f3f3f3]">iccid</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 border-b border-[#f3f3f3] font-mono">8901234567890123456</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-mono">8901234567890123457</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-[#828282] mt-2">
                    Use a single column named <span className="font-semibold">iccid</span>. One ICCID per row.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!batchFile || isSubmittingBatch} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
                    {isSubmittingBatch ? 'Importing...' : 'Import Excel Batch'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>)}
      </DialogContent>
      <ScanIccidDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScan={(value) => handleChange('iccid', value)}
      />
    </Dialog>);
}


