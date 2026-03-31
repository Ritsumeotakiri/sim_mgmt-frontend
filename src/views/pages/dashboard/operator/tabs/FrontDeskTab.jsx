import React from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FRONTDESK_PAGE_SIZE } from '../utils/constants';

export const FrontDeskTab = ({
  filteredCustomerInsights,
  frontDeskSearch,
  setFrontDeskSearch,
  frontDeskFilters,
  toggleFrontDeskFilter,
  activeFilterCount,
  canAddCustomer,
  setIsAddCustomerOpen,
  openCustomerPage,
//   frontDeskPage,
  setFrontDeskPage,
  frontDeskTotalPages,
  safeFrontDeskPage,
}) => {
  const paginatedCustomers = filteredCustomerInsights.slice(
    (safeFrontDeskPage - 1) * FRONTDESK_PAGE_SIZE,
    safeFrontDeskPage * FRONTDESK_PAGE_SIZE
  );

  return (
    <div className="space-y-5">
      <div className="bg-[#f9f9f9] rounded-xl border border-[#f3f3f3] p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-3">
            <Search className="w-4 h-4 text-[#828282] absolute left-3 top-1/2 -translate-y-1/2"/>
            <Input 
              value={frontDeskSearch} 
              onChange={(event) => setFrontDeskSearch(event.target.value)} 
              placeholder="Search by name, phone, email, ID number" 
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="justify-between w-auto min-w-[120px] h-8 px-3 text-xs justify-self-end">
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Activity</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                className="text-xs" 
                checked={frontDeskFilters.withTransactions} 
                onSelect={(event) => event.preventDefault()} 
                onCheckedChange={() => toggleFrontDeskFilter('withTransactions')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>With transactions</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                className="text-xs" 
                checked={frontDeskFilters.noTransactions} 
                onSelect={(event) => event.preventDefault()} 
                onCheckedChange={() => toggleFrontDeskFilter('noTransactions')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noTransactions ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>No transactions</span>
                </div>
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator/>
              <DropdownMenuLabel className="text-xs">SIM state</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                className="text-xs" 
                checked={frontDeskFilters.withActiveSim} 
                onSelect={(event) => event.preventDefault()} 
                onCheckedChange={() => toggleFrontDeskFilter('withActiveSim')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.withActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>With active SIM</span>
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                className="text-xs" 
                checked={frontDeskFilters.noActiveSim} 
                onSelect={(event) => event.preventDefault()} 
                onCheckedChange={() => toggleFrontDeskFilter('noActiveSim')}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] leading-none ${frontDeskFilters.noActiveSim ? 'border-[#1f1f1f] bg-[#1f1f1f] text-white' : 'border-[#c9c7c7] bg-white text-transparent'}`}>✓</span>
                  <span>No active SIM</span>
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-sm text-[#828282]">{filteredCustomerInsights.length} customer(s) found</p>
          {canAddCustomer && (
            <Button onClick={() => setIsAddCustomerOpen(true)} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90">
              <UserPlus className="w-4 h-4 mr-2"/>
              Register New Customer
            </Button>
          )}
        </div>
      </div>

      <div className="border border-[#f3f3f3] rounded-xl bg-white p-4">
        {filteredCustomerInsights.length === 0 ? (
          <div className="text-sm text-[#828282] py-12 text-center">No customer matches your search.</div>
        ) : (
          <div className="space-y-2">
            {paginatedCustomers.map(({ customer, customerTransactions, activeSims }) => (
              <button 
                key={customer.id} 
                type="button" 
                onClick={() => openCustomerPage(customer.id)} 
                className="w-full text-left rounded-lg border border-[#f3f3f3] p-3 hover:border-[#c9c7c7] hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#1f1f1f]">{customer.name}</p>
                    <p className="text-xs text-[#828282]">{customer.email || 'No email'} • {customer.phone || 'No phone'}</p>
                    <p className="text-xs text-[#828282]">ID: {customer.idNumber || 'N/A'}</p>
                  </div>
                  <div className="text-right text-xs text-[#828282]">
                    <p>{customerTransactions.length} transaction(s)</p>
                    <p>{activeSims.length} active SIM(s)</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredCustomerInsights.length > FRONTDESK_PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <p className="text-xs text-[#828282]">Page {safeFrontDeskPage} of {frontDeskTotalPages}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.max(1, previous - 1))} disabled={safeFrontDeskPage <= 1}>
                    <ChevronLeft className="w-4 h-4"/>
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setFrontDeskPage((previous) => Math.min(frontDeskTotalPages, previous + 1))} disabled={safeFrontDeskPage >= frontDeskTotalPages}>
                    <ChevronRight className="w-4 h-4"/>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};