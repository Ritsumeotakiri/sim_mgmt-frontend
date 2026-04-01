import { cn } from '@/presentation/lib/utils';
const roleStyles = {
    admin: 'bg-[#e9423a]/10 text-[#e9423a]',
    manager: 'bg-[#5b93ff]/10 text-[#5b93ff]',
    operator: 'bg-[#3ebb7f]/10 text-[#3ebb7f]',
    viewer: 'bg-[#828282]/10 text-[#828282]',
};
export function RoleBadge({ role }) {
    return (<span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize", roleStyles[role])}>
      {role}
    </span>);
}

