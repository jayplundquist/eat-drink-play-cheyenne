import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Plus, MapPin, Clock, Star, Check } from 'lucide-react';
import {
  formatDateShort,
  formatTime,
  getCategoryLabel,
  getNoteLabel,
  getEventTypeLabel,
  shouldRevealExactAddress,
  isLiveNow,
  getSaleUrl,
  formatSaleSchedule,
} from '@/lib/garageSaleHelpers';

export default function GarageSaleCard({ sale, saved, inRoute, onToggleSave, onAddToRoute, onRemoveFromRoute, compact = false }) {
  const reveal = shouldRevealExactAddress(sale);
  const live = isLiveNow(sale);

  return (
    <div className={`bg-white rounded-xl border-2 ${inRoute ? 'border-amber-500 bg-amber-50/40' : sale.featured ? 'border-amber-400' : 'border-stone-200'} shadow-sm overflow-hidden flex flex-col`}>
      {sale.photos?.[0] && (
        <Link to={getSaleUrl(sale)} className="block relative">
          <img src={sale.photos[0]} alt={sale.title} className="w-full h-32 object-cover" />
          {sale.featured && (
            <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          {live && (
            <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ● Live Now
            </span>
          )}
        </Link>
      )}

      <div className="p-3 flex flex-col flex-1">
        <Link to={getSaleUrl(sale)}>
          <h3 className="font-bold text-stone-800 text-base leading-tight hover:text-amber-700">{sale.title}</h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{reveal ? `${sale.address}, ${sale.city}` : `Approximate location · ${sale.city || 'Cheyenne'}`}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{formatSaleSchedule(sale)}</span>
        </div>

        {sale.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {sale.categories.slice(0, 5).map((c) => (
              <span key={c} className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {getCategoryLabel(c)}
              </span>
            ))}
          </div>
        )}

        {sale.special_notes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {sale.special_notes.slice(0, 3).map((n) => (
              <span key={n} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                {getNoteLabel(n)}
              </span>
            ))}
          </div>
        )}

        {!compact && sale.description && (
          <p className="text-xs text-stone-600 mt-2 line-clamp-2">{sale.description}</p>
        )}

        <div className="mt-3 pt-2 mt-auto space-y-2">
          <div className="flex gap-1.5">
            <Link to={getSaleUrl(sale)} className="flex-1">
              <Button size="sm" variant="outline" className="w-full border-stone-300 text-stone-700 hover:text-amber-700">View Details</Button>
            </Link>
            {onToggleSave && (
              <Button
                size="sm"
                variant={saved ? 'default' : 'outline'}
                onClick={() => onToggleSave(sale)}
                className={saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-stone-300'}
                title={saved ? 'Saved — tap to remove' : 'Save sale'}
                aria-label={saved ? 'Saved' : 'Save sale'}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
          {onAddToRoute && !inRoute && (
            <Button size="sm" onClick={() => onAddToRoute(sale)} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add to Route
            </Button>
          )}
          {onRemoveFromRoute && inRoute && (
            <Button size="sm" onClick={() => onRemoveFromRoute(sale)} className="w-full bg-amber-800 hover:bg-amber-900 text-white">
              <Check className="w-4 h-4 mr-1" /> In My Route
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}