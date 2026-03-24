import { toast } from 'sonner';
import { backendApi } from '@/services/backendApi';
import { isAuthExpiredError } from '@/services/backendApi/client';
export function useMSISDNManagement() {
    const normalizeMsisdn = (value) => value.replace(/[^\d+]/g, '').trim();
    const handleAddMSISDN = async (msisdnData, setMsisdns) => {
        const normalizedNumber = normalizeMsisdn(msisdnData.number || '');
        const normalizedPrice = Number(msisdnData.price || 0);
        if (!normalizedNumber) {
            toast.error('Phone number is required');
            return false;
        }
        if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
            toast.error('Price must be a positive number');
            return false;
        }
        try {
            const created = await backendApi.createMsisdnWithBranch({
                number: normalizedNumber,
                price: normalizedPrice,
                branchId: msisdnData.branchId || null,
            });
            if (typeof setMsisdns === 'function') {
                setMsisdns(prev => [created, ...prev]);
            }
            toast.success('MSISDN added to inventory');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to add MSISDN');
            return false;
        }
    };
    const handleEditMSISDN = async (msisdn, setMsisdns) => {
        const normalizedNumber = normalizeMsisdn(msisdn.number || '');
        const normalizedPrice = Number(msisdn.price || 0);
        if (!normalizedNumber) {
            toast.error('Phone number is required');
            return false;
        }
        if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
            toast.error('Price must be a positive number');
            return false;
        }
        try {
            const updated = await backendApi.updateMsisdn(msisdn.id, {
                number: normalizedNumber,
                price: normalizedPrice,
                status: msisdn.status,
                branchId: msisdn.branchId || null,
            });
            if (typeof setMsisdns === 'function') {
                setMsisdns(prev => prev.map(item => item.id === msisdn.id
                    ? updated
                    : item));
            }
            toast.success('MSISDN updated successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to update MSISDN');
            return false;
        }
    };
    const handleDeleteMSISDN = async (id, setMsisdns) => {
        try {
            await backendApi.deleteMsisdn(id);
            if (typeof setMsisdns === 'function') {
                setMsisdns(prev => prev.filter(item => item.id !== id));
            }
            toast.success('MSISDN deleted successfully');
            return true;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to delete MSISDN');
            return false;
        }
    };
    const handleImportMSISDNBatch = async (params) => {
        const normalizedPrice = Number(params.price || 0);
        if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
            toast.error('Default price must be a positive number');
            return false;
        }
        try {
            const summary = await backendApi.importMsisdnFromExcel({
                file: params.file,
                status: params.status || 'available',
                price: normalizedPrice,
                branchId: params.branchId || null,
            });
            toast.success(`Import complete: ${summary.inserted || 0} inserted, ${summary.skipped || 0} skipped`);
            return summary;
        }
        catch (error) {
            if (isAuthExpiredError(error)) {
                return false;
            }
            toast.error(error instanceof Error ? error.message : 'Failed to import MSISDN Excel batch');
            return false;
        }
    };
    return {
        handleAddMSISDN,
        handleEditMSISDN,
        handleDeleteMSISDN,
        handleImportMSISDNBatch,
    };
}
