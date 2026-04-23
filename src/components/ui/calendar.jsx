import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-3 sm:space-x-3 sm:space-y-0 w-full justify-center",
        month: "space-y-3 w-full max-w-full",
        caption: "flex justify-center pt-1 relative items-center mb-1 w-full",
        caption_label: "text-sm font-semibold",
        caption_dropdowns: "flex justify-center gap-1.5",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse mx-auto",
        head_row: "flex w-full mb-1",
        head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-xs text-center",
        row: "flex w-full mt-1 justify-between",
        cell: "text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "calendar-day-cell font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground transition-colors"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside: "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: ({ value, onChange, children, ...restProps }) => {
          const options = React.Children.toArray(children);
          const selected = options.find(child => child.props.value === value);
          const handleChange = (newValue) => {
            const changeEvent = {
              target: { value: newValue },
            };
            onChange?.(changeEvent);
          };
          return (
            <Select
              value={value?.toString()}
              onValueChange={(value) => {
                handleChange(value)
              }}
            >
              <SelectTrigger className="h-7 pr-1.5 focus:ring-0 w-auto text-xs font-medium">
                <SelectValue>{selected?.props?.children}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                <div className="max-h-48 overflow-y-auto text-sm">
                  {React.Children.map(children, child => 
                    <SelectItem value={child.props.value.toString()} key={child.props.value} className="text-xs">
                      {child.props.children}
                    </SelectItem>
                  )}
                </div>
              </SelectContent>
            </Select>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }