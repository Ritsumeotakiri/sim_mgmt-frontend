import { TransactionsTable } from '@/presentation/views/components/transaction/TransactionsTable';

export function OverviewTab({ transactions }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-[#1f1f1f] mb-4">Recent Transactions</h3>
        <TransactionsTable transactions={transactions} useServerPagination={true}/>
      </div>
    </div>
  );
}

export default OverviewTab;
