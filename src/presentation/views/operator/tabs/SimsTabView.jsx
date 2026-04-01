import React from 'react';
import { Input } from '@/presentation/components/ui/input';
import { Button } from '@/presentation/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NUMBER_POOL_PAGE_SIZE } from '@/presentation/views/operator/utils/constants';
import { formatNumberDisplay } from '@/presentation/views/operator/utils/dateUtils';

export const SimsTabView = ({
  sellableNumberPool,
  numberPoolSearch,
  setNumberPoolSearch,
//   numberPoolPage,
  setNumberPoolPage,
  numberPoolTotalPages,
  safeNumberPoolPage,
  paginatedNumberPool,
  setSellingSIM,
  setIsSellModalOpen,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1f1f1f]">Number Pool Sell by Number</h3>
        </div>
        <div className="w-full max-w-sm">
          <Input 
            value={numberPoolSearch} 
            onChange={(event) => setNumberPoolSearch(event.target.value)} 
            placeholder="Search number..."
          />
        </div>
      </div>

      {sellableNumberPool.length === 0 ? (
        <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-6 text-sm text-[#828282] text-center">
          No available numbers found.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {paginatedNumberPool.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-[#f3f3f3] p-4 bg-white hover:border-[#c9c7c7] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#1f1f1f] mb-1">{formatNumberDisplay(entry.number)}</p>
                    <p className="text-xs text-[#828282]">Available</p>
                  </div>
                  <p className="text-xl font-bold text-[#1f1f1f] leading-none">${Number(entry.price || 0).toFixed(2)}</p>
                </div>
                <div className="flex justify-end mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setSellingSIM({ preselectedMSISDN: entry });
                      setIsSellModalOpen(true);
                    }} 
                    className="h-8 px-4 bg-[#3ebb7f] hover:bg-[#3ebb7f]/90 text-white"
                  >
                    Sell
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {sellableNumberPool.length > NUMBER_POOL_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#828282]">Page {safeNumberPoolPage} of {numberPoolTotalPages}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setNumberPoolPage((previous) => Math.max(1, previous - 1))} disabled={safeNumberPoolPage <= 1}>
                  <ChevronLeft className="w-4 h-4"/>
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setNumberPoolPage((previous) => Math.min(numberPoolTotalPages, previous + 1))} disabled={safeNumberPoolPage >= numberPoolTotalPages}>
                  <ChevronRight className="w-4 h-4"/>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
