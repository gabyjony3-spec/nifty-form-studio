import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface SubscriptionFiltersProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
}

const SubscriptionFilters = ({ onFilterChange }: SubscriptionFiltersProps) => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    const now = new Date();
    
    switch (filter) {
      case "today":
        onFilterChange(new Date(now.setHours(0, 0, 0, 0)), new Date());
        break;
      case "7days":
        onFilterChange(subDays(now, 7), new Date());
        break;
      case "30days":
        onFilterChange(subDays(now, 30), new Date());
        break;
      case "month":
        onFilterChange(startOfMonth(now), endOfMonth(now));
        break;
      case "all":
      default:
        onFilterChange(null, null);
        break;
    }
    setDateRange(undefined);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setActiveFilter("custom");
      onFilterChange(range.from, range.to || range.from);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => handleQuickFilter("all")}
      >
        Todos
      </Button>
      <Button
        variant={activeFilter === "today" ? "default" : "outline"}
        size="sm"
        onClick={() => handleQuickFilter("today")}
      >
        Hoje
      </Button>
      <Button
        variant={activeFilter === "7days" ? "default" : "outline"}
        size="sm"
        onClick={() => handleQuickFilter("7days")}
      >
        7 dias
      </Button>
      <Button
        variant={activeFilter === "30days" ? "default" : "outline"}
        size="sm"
        onClick={() => handleQuickFilter("30days")}
      >
        30 dias
      </Button>
      <Button
        variant={activeFilter === "month" ? "default" : "outline"}
        size="sm"
        onClick={() => handleQuickFilter("month")}
      >
        Este mês
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activeFilter === "custom" ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM", { locale: pt })} -{" "}
                  {format(dateRange.to, "dd/MM", { locale: pt })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: pt })
              )
            ) : (
              "Período"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={1}
            locale={pt}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SubscriptionFilters;
