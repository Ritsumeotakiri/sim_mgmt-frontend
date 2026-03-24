import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BackButton({ onClick, label = 'Back', className, variant = 'outline', size = 'sm', disabled = false }) {
  return (
    <Button type="button" variant={variant} size={size} onClick={onClick} disabled={disabled} className={cn('inline-flex items-center gap-1.5 self-start', className)}>
      <ChevronLeft className="w-4 h-4"/>
      <span>{label}</span>
    </Button>
  );
}
