import { Button } from '@/presentation/components/ui/button';

export function OperatorTab() {
  // Links include `as=manager` so operator pages can record manager activity
  const links = [
    { label: 'Number Pool', href: '/operator?tab=number-pool&as=manager' },
    { label: 'SIM Profile', href: '/operator?tab=sim-profile&as=manager' },
    { label: 'Customer Profile', href: '/operator?tab=customer-profile&as=manager' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#828282]">Open operator views as manager — actions will include the manager context.</p>
      <div className="flex gap-3">
        {links.map((l) => (
          <Button key={l.href} as="a" href={l.href} className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90" target="_self">
            {l.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default OperatorTab;
