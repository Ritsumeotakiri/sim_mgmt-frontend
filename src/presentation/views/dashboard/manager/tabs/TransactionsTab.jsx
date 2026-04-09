import { TransactionsTable } from '@/presentation/views/components/transaction/TransactionsTable';

export function TransactionsTab({ transactions }) {
  return <TransactionsTable transactions={transactions} useServerPagination={true}/>;
}

export default TransactionsTab;
