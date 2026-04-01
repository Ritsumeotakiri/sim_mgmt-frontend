import { cn } from '@/presentation/lib/utils';
const simStatusStyles = {
    active: 'bg-[#3ebb7f]/10 text-[#3ebb7f]',
    pending: 'bg-[#f6a94c]/10 text-[#f6a94c]',
    suspended: 'bg-[#e9423a]/10 text-[#e9423a]',
    inactive: 'bg-[#828282]/10 text-[#828282]',
};
const transactionStatusStyles = {
    completed: 'bg-[#3ebb7f]/10 text-[#3ebb7f]',
    pending: 'bg-[#f6a94c]/10 text-[#f6a94c]',
    failed: 'bg-[#e9423a]/10 text-[#e9423a]',
};
export function StatusBadge({ status, type = 'sim' }) {
    const styles = type === 'sim' ? simStatusStyles : transactionStatusStyles;
    return (<span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>);
}

