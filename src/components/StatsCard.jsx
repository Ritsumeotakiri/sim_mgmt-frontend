import { cn } from '@/lib/utils';
const accentColors = {
    blue: 'border-l-[#5b93ff]',
    green: 'border-l-[#3ebb7f]',
    amber: 'border-l-[#f6a94c]',
    red: 'border-l-[#e9423a]',
};
const iconColors = {
    blue: 'text-[#5b93ff] bg-[#5b93ff]/10',
    green: 'text-[#3ebb7f] bg-[#3ebb7f]/10',
    amber: 'text-[#f6a94c] bg-[#f6a94c]/10',
    red: 'text-[#e9423a] bg-[#e9423a]/10',
};
export function StatsCard({ title, value, icon: Icon, accentColor, change, changeType }) {
    return (<div className={cn("bg-white rounded-xl p-5 border border-[#f3f3f3] border-l-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", accentColors[accentColor])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#828282] mb-1">{title}</p>
          <p className="text-2xl font-semibold text-[#1f1f1f]">{value}</p>
          {change && (<p className={cn("text-xs mt-2", changeType === 'positive' && "text-[#3ebb7f]", changeType === 'negative' && "text-[#e9423a]", changeType === 'neutral' && "text-[#828282]")}>
              {change}
            </p>)}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColors[accentColor])}>
          <Icon className="w-5 h-5"/>
        </div>
      </div>
    </div>);
}
