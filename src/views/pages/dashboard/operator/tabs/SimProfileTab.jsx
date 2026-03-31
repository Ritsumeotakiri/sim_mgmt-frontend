import React from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/views/components/common/BackButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '../utils/dateUtils';
import { SIM_TX_PAGE_SIZE } from '../utils/constants';

export const SimProfileTab = ({
  selectedCustomerSim,
  selectedCustomerInsight,
  plans,
  selectedSimTransactions,
  paginatedSimTransactions,
//   simTxPage,
  setSimTxPage,
  simTxTotalPages,
  safeSimTxPage,
  setActiveTab,
}) => {
  if (!selectedCustomerSim) {
    return (
      <div className="border border-[#f3f3f3] rounded-xl bg-white p-6 text-sm text-[#828282] text-center">
        SIM profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <BackButton onClick={() => setActiveTab('customer-profile')} label="Back to Customer"/>
      </div>

      <div className="border border-[#f3f3f3] rounded-xl bg-white p-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'No MSISDN'} • SIM #{selectedCustomerSim.id}</h3>
          <p className="text-sm text-[#828282]">ICCID: {selectedCustomerSim.iccid || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">MSISDN</p>
            <p className="text-base font-semibold text-[#1f1f1f]">{selectedCustomerSim.msisdn || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Status</p>
            <p className="text-base font-semibold text-[#1f1f1f] capitalize">{selectedCustomerSim.status || 'unknown'}</p>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Plan</p>
            <p className="text-base font-semibold text-[#1f1f1f]">{plans.find((plan) => plan.id === selectedCustomerSim.planId)?.name || (selectedCustomerSim.planId ? `Plan #${selectedCustomerSim.planId}` : 'No plan')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Owner</p>
            <p className="text-sm text-[#1f1f1f]">{selectedCustomerInsight?.customer?.name || selectedCustomerSim.assignedTo || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3">
            <p className="text-xs text-[#828282]">Created</p>
            <p className="text-sm text-[#1f1f1f]">{formatDateTime(selectedCustomerSim.createdAt)}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#1f1f1f] mb-2">SIM Transactions</h4>
          {selectedSimTransactions.length === 0 ? (
            <p className="text-sm text-[#828282]">No transactions found for this SIM.</p>
          ) : (
            <div className="space-y-2">
              {paginatedSimTransactions.map((transaction) => (
                <div key={`sim-tx-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')} ({transaction.status || 'unknown'})</p>
                    <p className="text-xs text-[#828282]">{formatDateTime(transaction.date)}</p>
                  </div>
                  <p className="text-xs text-[#828282] mt-1">By: {transaction.userName || 'System'}</p>
                </div>
              ))}
              {selectedSimTransactions.length > SIM_TX_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-xs text-[#828282]">Page {safeSimTxPage} of {simTxTotalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.max(1, previous - 1))} disabled={safeSimTxPage <= 1}>
                      <ChevronLeft className="w-4 h-4"/>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSimTxPage((previous) => Math.min(simTxTotalPages, previous + 1))} disabled={safeSimTxPage >= simTxTotalPages}>
                      <ChevronRight className="w-4 h-4"/>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};