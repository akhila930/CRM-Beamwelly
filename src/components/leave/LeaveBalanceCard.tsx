import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LeaveBalanceCardProps {
  type: string;
  used: number;
  total: number;
  remaining: number;
}

export function LeaveBalanceCard({ type, used, total, remaining }: LeaveBalanceCardProps) {
  const percentage = (used / total) * 100;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{type}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold tracking-tight">{remaining}</span>
          <span className="text-sm text-muted-foreground">of {total} days</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {total - remaining} days used this year
        </p>
      </CardContent>
    </Card>
  );
}
