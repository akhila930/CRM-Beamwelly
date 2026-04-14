
import { useFadeIn } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'primary' | 'red' | 'blue' | 'green' | 'yellow';
  className?: string;
  delay?: number;
}

export function KpiCard({
  title,
  value,
  description,
  icon,
  color = 'default',
  className,
  delay = 0,
}: KpiCardProps) {
  const fadeStyle = useFadeIn(delay);
  
  const colorClasses = {
    default: '',
    primary: 'border-brand-red/40',
    red: 'border-red-500/40',
    blue: 'border-blue-500/40',
    green: 'border-green-500/40',
    yellow: 'border-yellow-500/40',
  };
  
  const iconColorClasses = {
    default: 'text-muted-foreground',
    primary: 'text-brand-red',
    red: 'text-red-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
  };

  return (
    <Card 
      className={cn('overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 relative', 
        colorClasses[color], 
        className
      )}
      style={fadeStyle}
    >
      <div className="flex justify-between p-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <CardDescription className="text-2xl font-bold tracking-tight">{value}</CardDescription>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-full', iconColorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
      <div className={cn('h-1', {
        'bg-gradient-to-r from-brand-red/20 via-brand-red to-brand-red/20': color === 'primary',
        'bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20': color === 'red',
        'bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20': color === 'blue',
        'bg-gradient-to-r from-green-500/20 via-green-500 to-green-500/20': color === 'green',
        'bg-gradient-to-r from-yellow-500/20 via-yellow-500 to-yellow-500/20': color === 'yellow',
        'bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200': color === 'default',
      })} />
    </Card>
  );
}
