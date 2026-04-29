import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  UserPlus,
  ShoppingCart,
  WalletCards,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { FRONTDESK_PAGE_SIZE } from '@/presentation/views/operator/utils/constants';
import { useFrontDeskActionsViewModel } from '@/presentation/viewModels/operator/useFrontDeskActionsViewModel';
import { TopUpDialog } from '@/presentation/views/operator/components/TopUpDialog';
import { ChangePlanDialog } from '@/presentation/views/operator/components/ChangePlanDialog';

export const FrontDeskTabView = ({
  customers,
  sims,
  plans,
  filteredCustomerInsights,
  frontDeskSearch,
  setFrontDeskSearch,
  frontDeskFilters,
  toggleFrontDeskFilter,
  activeFilterCount,
  canAddCustomer,
  setIsAddCustomerOpen,
  openCustomerPage,
  setFrontDeskPage,
  frontDeskTotalPages,
  safeFrontDeskPage,
  onOpenSaleAction,
  onSubmitTopUpAction,
  onSubmitChangePlanAction,
}) => {
  // Compute paginated customers for the main list
  const paginatedCustomers = useMemo(
    () =>
      filteredCustomerInsights.slice(
        (safeFrontDeskPage - 1) * FRONTDESK_PAGE_SIZE,
        safeFrontDeskPage * FRONTDESK_PAGE_SIZE
      ),
    [filteredCustomerInsights, safeFrontDeskPage]
  );

  // All actions and state from the view model
  const actions = useFrontDeskActionsViewModel({
    customers,
    sims,
    plans,
    onOpenSaleAction,
    onSubmitTopUpAction,
    onSubmitChangePlanAction,
  });

  // Stable handlers for pagination buttons
  const handlePrevPage = useCallback(
    () => setFrontDeskPage((prev) => Math.max(1, prev - 1)),
    [setFrontDeskPage]
  );
  const handleNextPage = useCallback(
    () => setFrontDeskPage((prev) => Math.min(frontDeskTotalPages, prev + 1)),
    [setFrontDeskPage, frontDeskTotalPages]
  );

  // Search input change handler
  const handleSearchChange = useCallback(
    (event) => setFrontDeskSearch(event.target.value),
    [setFrontDeskSearch]
  );

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2">
        <button
          type="button"
          onClick={actions.handleQuickSale}
          className="rounded-xl border border-[#d9d9d9] bg-[#f8f8f8] p-4 shadow-sm text-center transition-all hover:border-[#cfcfcf] hover:bg-[#f2f2f2] min-h-[96px] flex flex-col items-center justify-center gap-2"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-white">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1f1f1f]">
            Sale SIM
          </div>
        </button>
        <button
          type="button"
          onClick={actions.openTopUpDialog}
          className="rounded-xl border border-[#d8e4ff] bg-[#eef4ff] p-4 shadow-sm text-center transition-all hover:border-[#c9d8ff] hover:bg-[#e5efff] min-h-[96px] flex flex-col items-center justify-center gap-2"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5b93ff] text-white">
            <WalletCards className="h-4 w-4" />
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f4f8f]">
            Top Up
          </div>
        </button>
        <button
          type="button"
          onClick={actions.openChangePlanDialog}
          className="rounded-xl border border-[#ffe5c8] bg-[#fff5e9] p-4 shadow-sm text-center transition-all hover:border-[#ffd9ae] hover:bg-[#ffefdb] min-h-[96px] flex flex-col items-center justify-center gap-2"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f6a94c] text-white">
            <Repeat className="h-4 w-4" />
          </span>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5b1d]">
            Change Plan
          </div>
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#828282] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={frontDeskSearch}
              onChange={handleSearchChange}
              placeholder="Search by name, phone, email, ID number"
              className="pl-9 h-12 text-sm"
              style={{ minWidth: 0 }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-12 px-3 text-xs min-w-[100px]"
              >
                {activeFilterCount > 0
                  ? `Filters (${activeFilterCount})`
                  : 'Filters'}
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
                With transactions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.noTransactions}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('noTransactions')}
              >
                No transactions
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">SIM state</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.withActiveSim}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('withActiveSim')}
              >
                With active SIM
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={frontDeskFilters.noActiveSim}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => toggleFrontDeskFilter('noActiveSim')}
              >
                No active SIM
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canAddCustomer && (
            <Button
              onClick={() => setIsAddCustomerOpen(true)}
              className="bg-[#3ebb7f] hover:bg-[#3ebb7f] h-12 px-4 text-sm flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-2"/>
              Register New Customer
            </Button>
          )}
        </div>
      </div>

      {/* Customer list */}
      <div className="border border-[#f3f3f3] rounded-xl bg-white overflow-hidden">
        {filteredCustomerInsights.length === 0 ? (
          <div className="text-sm text-[#828282] py-12 text-center">
            No customer matches your search.
          </div>
        ) : (
          <div className="divide-y divide-[#f1f1f1]">
            {paginatedCustomers.map(({ customer, activeSims,}) => {
              const initials = String(customer.name || 'Customer')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('');

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => openCustomerPage(customer.id)}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1f]/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-[#f3f3f3] text-[#1f1f1f] flex items-center justify-center text-sm font-semibold">
                      {initials || 'CU'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-[#1f1f1f] truncate">
                          {customer.name}
                        </p>
                        <span className="text-xs text-[#828282]">
                          ID {customer.idNumber || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-[#828282] truncate">
                        {customer.email || 'No email'} •{' '}
                        {customer.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2 text-xs text-[#5f5f5f] sm:flex-row sm:items-center sm:gap-2">
                      <span className='rounded-full bg-[#3ebb7f] text-[#ffffff] px-3 py-1.5'>
                        {/* customer total sims */}
                        {customer.totalSims} SIM(s)
                      </span>
                      <span className="rounded-full bg-[#eef4ff] text-[#2f4f8f] px-3 py-1.5">
                        {activeSims.length} active SIM(s)
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredCustomerInsights.length > FRONTDESK_PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
                <p className="text-xs text-[#828282]">
                  Page {safeFrontDeskPage} of {frontDeskTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={handlePrevPage}
                    disabled={safeFrontDeskPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={handleNextPage}
                    disabled={safeFrontDeskPage >= frontDeskTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TopUpDialog actions={actions} />
      <ChangePlanDialog actions={actions} />
    </div>
  );
};

FrontDeskTabView.propTypes = {
  customers: PropTypes.array.isRequired,
  sims: PropTypes.array.isRequired,
  plans: PropTypes.array.isRequired,
  filteredCustomerInsights: PropTypes.array.isRequired,
  frontDeskSearch: PropTypes.string.isRequired,
  setFrontDeskSearch: PropTypes.func.isRequired,
  frontDeskFilters: PropTypes.object.isRequired,
  toggleFrontDeskFilter: PropTypes.func.isRequired,
  activeFilterCount: PropTypes.number.isRequired,
  canAddCustomer: PropTypes.bool.isRequired,
  setIsAddCustomerOpen: PropTypes.func.isRequired,
  openCustomerPage: PropTypes.func.isRequired,
  setFrontDeskPage: PropTypes.func.isRequired,
  frontDeskTotalPages: PropTypes.number.isRequired,
  safeFrontDeskPage: PropTypes.number.isRequired,
  onOpenSaleAction: PropTypes.func.isRequired,
  onSubmitTopUpAction: PropTypes.func.isRequired,
  onSubmitChangePlanAction: PropTypes.func.isRequired,
};