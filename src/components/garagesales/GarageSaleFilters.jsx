import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { GARAGE_SALE_CATEGORIES, formatDateShort, localDateStr } from '@/lib/garageSaleHelpers';

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This Weekend' },
  { value: 'all', label: 'All Upcoming' },
];

const calendarClassNames = {
  months: 'text-stone-800',
  month: 'space-y-3',
  caption: 'flex justify-center pt-1 relative items-center',
  caption_label: 'text-stone-800 font-semibold text-sm',
  nav: 'space-x-1 flex items-center',
  nav_button:
    'inline-flex items-center justify-center h-7 w-7 bg-transparent border border-amber-300 rounded-md text-amber-700 hover:bg-amber-100',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse',
  head_row: 'flex',
  head_cell: 'text-stone-500 rounded-md w-8 font-normal text-xs',
  row: 'flex w-full mt-1',
  cell: 'relative p-0 text-center text-sm',
  day: 'inline-flex items-center justify-center text-stone-700 h-8 w-8 p-0 font-normal rounded-md hover:bg-amber-100 aria-selected:opacity-100',
  day_selected:
    'bg-amber-600 text-white hover:bg-amber-700 hover:text-white focus:bg-amber-600 focus:text-white',
  day_today: 'bg-amber-100 text-amber-800 font-semibold',
  day_outside: 'text-stone-300',
  day_disabled: 'text-stone-300 opacity-50',
  day_hidden: 'invisible',
};

export default function GarageSaleFilters({
  dateFilter,
  setDateFilter,
  specificDate,
  setSpecificDate,
  selectedCats,
  toggleCat,
  onClearAll,
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const hasFilters = dateFilter !== 'all' || selectedCats.length > 0 || specificDate;

  return (
    <div className="bg-white/95 backdrop-blur border-b-2 border-amber-200 px-3 py-2.5 space-y-2">
      {/* Date filters — 2x2 grid on mobile, single row on desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:items-center">
          {DATE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={dateFilter === opt.value ? 'default' : 'outline'}
              onClick={() => setDateFilter(opt.value)}
              className={dateFilter === opt.value ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700' : 'border-stone-300'}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={dateFilter === 'specific' ? 'default' : 'outline'}
                className={dateFilter === 'specific' ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700' : 'border-stone-300'}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                {specificDate ? formatDateShort(specificDate) : 'Pick a Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[19rem] p-0 bg-amber-50 border-amber-300 shadow-lg" align="start">
              <Calendar
                mode="single"
                fixedWeeks
                selected={specificDate ? new Date(specificDate + 'T00:00:00') : undefined}
                onSelect={(d) => {
                  if (d) {
                    setSpecificDate(localDateStr(d));
                    setDateFilter('specific');
                    setDateOpen(false);
                  }
                }}
                classNames={calendarClassNames}
                className="bg-amber-50"
              />
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={onClearAll} className="text-stone-500">
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Category filters — horizontal scroll (partial next item signals swipe) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {GARAGE_SALE_CATEGORIES.map((cat) => {
          const active = selectedCats.includes(cat.value);
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggleCat(cat.value)}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full border-2 transition-colors ${
                active
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-amber-400'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}