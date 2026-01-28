"use client";

import { useMonthStore } from "@/store/useMonthStore";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthPicker() {
  const { month, year, setMonthYear } = useMonthStore();

  function prev() {
    if (month === 1) setMonthYear(12, year - 1);
    else setMonthYear(month - 1, year);
  }

  function next() {
    if (month === 12) setMonthYear(1, year + 1);
    else setMonthYear(month + 1, year);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={prev} aria-label="Previous month">
        ←
      </Button>
      <span className="min-w-[140px] text-center font-medium">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="outline" size="icon" onClick={next} aria-label="Next month">
        →
      </Button>
    </div>
  );
}
