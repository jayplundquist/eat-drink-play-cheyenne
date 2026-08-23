import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { GARAGE_SALE_CATEGORIES } from '@/lib/garageSaleHelpers';

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This Weekend' },
  { value: 'all', label: 'All Upcoming' },
];

export default function GarageSaleFilters({
  dateFilter,
  setDateFilter,
  specificDate,
  setSpecificDate,
  selectedCats,
  toggleCat,
  onClearAll,
}) {
  return (
    <div className="bg-white/95 backdrop-blur border-b-2 border-amber-200 px-3 py-2.5 space-y-2">
      {/* Date filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
        {DATE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={dateFilter === opt.value ? 'default' : 'outline'}
            onClick={() => setDateFilter(opt.value)}
            className={`shrink-0 ${dateFilter === opt.value ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-stone-300'}`}
          >
            {opt.label}
          </Button>
        ))}
        <input
          type="date"
          value={specificDate || ''}
          onChange={(e) => {
            setSpecificDate(e.target.value);
            setDateFilter('specific');
          }}
          className="shrink-0 text-sm border border-stone-300 rounded-md px-2 py-1 text-stone-700"
        />
        {(dateFilter !== 'all' || selectedCats.length > 0 || specificDate) && (
          <Button size="sm" variant="ghost" onClick={onClearAll} className="shrink-0 text-stone-500">
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Category filters */}
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