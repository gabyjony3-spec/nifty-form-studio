import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BarChart3 } from "lucide-react";

interface PostingTimeData {
  hour: number;
  score: number;
}

interface BestPostingTimesProps {
  data?: PostingTimeData[] | null;
  isLoading?: boolean;
}

export function BestPostingTimes({ data, isLoading }: BestPostingTimesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Melhores Horários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Faça uma análise para ver os melhores horários para postar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top 5 best hours
  const topHours = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const maxScore = Math.max(...data.map(d => d.score));

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getScoreColor = (score: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Melhores Horários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Hours List */}
        <div className="space-y-3">
          {topHours.map((item, index) => (
            <div key={item.hour} className="flex items-center gap-3">
              <span className="text-xs font-bold w-5 text-center text-muted-foreground">
                #{index + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{formatHour(item.hour)}</span>
                  <span className="text-xs text-muted-foreground">{item.score}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getScoreColor(item.score)}`}
                    style={{ width: `${(item.score / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hour Grid Visualization */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Distribuição por hora</p>
          <div className="grid grid-cols-12 gap-1">
            {data.slice(6, 24).map((item) => (
              <div
                key={item.hour}
                className={`h-6 rounded-sm ${getScoreColor(item.score)} opacity-${Math.max(20, Math.floor((item.score / maxScore) * 100))}`}
                title={`${formatHour(item.hour)}: ${item.score}% engagement`}
                style={{ opacity: Math.max(0.2, item.score / maxScore) }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>00:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
