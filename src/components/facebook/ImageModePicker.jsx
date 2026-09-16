import React from 'react';
import { Image, Sparkles, Upload, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODES = [
  { value: 'venue_photo', label: 'Venue Photo', icon: Image },
  { value: 'ai_generated', label: 'AI Image', icon: Sparkles },
  { value: 'uploaded', label: 'Upload', icon: Upload },
  { value: 'none', label: 'None', icon: ImageOff },
];

export default function ImageModePicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MODES.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 text-sm transition-colors',
              value === m.value
                ? 'bg-amber-800 text-amber-50 border-amber-900'
                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}