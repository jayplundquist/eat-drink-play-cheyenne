import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';

/**
 * Layer definitions matching the Cheyenne Greenway & Activities reference map.
 * `kind` drives how the page renders each item: line | polygon | marker.
 */
export const LAYERS = [
  { id: 'greenway',   label: 'Greenway (10 ft Concrete)',        color: '#047857', kind: 'line',    weight: 6, solid: true },
  { id: 'shared',     label: 'Shared Use Trail (Asphalt)',      color: '#65a30d', kind: 'line',    weight: 5, solid: true },
  { id: 'bikeroute',  label: 'On Street Bike Routes',           color: '#ea580c', kind: 'line',    weight: 4, dashed: true },
  { id: 'dirt',       label: 'Dirt Bike Trail',                 color: '#92400e', kind: 'line',    weight: 4, dashed: true },
  { id: 'activities', label: 'Trailheads & Activities',        color: '#92400e', kind: 'marker' },
  { id: 'parks',      label: 'City Parks',                      color: '#4ade80', kind: 'polygon' },
  { id: 'creeks',     label: 'Creeks',                          color: '#0ea5e9', kind: 'line',    weight: 4 },
  { id: 'lakes',      label: 'Lakes',                           color: '#38bdf8', kind: 'polygon' },
];

export const DEFAULT_VISIBLE = ['greenway', 'shared', 'activities', 'parks', 'creeks', 'lakes'];

/**
 * Collapsible layer list with per-layer visibility toggles and live item counts,
 * mirroring the reference map's legend / layer panel.
 */
export default function GreenwayLayerControl({ visible, onToggle, counts = {} }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute top-3 right-3 z-[1000] max-w-[240px]">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(o => !o)}
          className="bg-amber-800 hover:bg-amber-900 text-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <Layers className="w-4 h-4" />
          {open ? <X className="w-4 h-4" /> : <span>Layers</span>}
        </button>
      </div>

      {open && (
        <div className="mt-2 bg-white/95 backdrop-blur rounded-lg shadow-xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Map Layers</p>
            <p className="text-[11px] text-stone-500">Total items: {Object.values(counts).reduce((a, b) => a + b, 0)}</p>
          </div>
          <ul className="divide-y divide-stone-100">
            {LAYERS.map((layer, idx) => {
              const isVisible = visible.has(layer.id);
              const count = counts[layer.id] ?? 0;
              return (
                <li key={layer.id}>
                  <button
                    onClick={() => onToggle(layer.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      isVisible ? 'bg-white hover:bg-amber-50' : 'bg-stone-100 hover:bg-stone-200 opacity-70'
                    }`}
                  >
                    <span className="text-[11px] text-stone-400 font-mono w-5 flex-shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {layer.kind === 'line' && (
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{
                          width: 22,
                          height: layer.weight + 2,
                          background: layer.color,
                          backgroundImage: layer.dashed
                            ? `repeating-linear-gradient(90deg, ${layer.color} 0 6px, transparent 6px 11px)`
                            : undefined,
                        }}
                      />
                    )}
                    {layer.kind === 'polygon' && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-sm border" style={{ background: layer.color, borderColor: layer.color }} />
                    )}
                    {layer.kind === 'marker' && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-800 border-2 border-white shadow" />
                    )}
                    <span className="text-xs text-stone-700 leading-tight flex-1">{layer.label}</span>
                    <span className="text-[11px] text-stone-400 flex-shrink-0">{count}</span>
                    <span className={`flex-shrink-0 w-4 h-4 flex items-center justify-center ${isVisible ? 'text-amber-700' : 'text-stone-300'}`}>
                      {isVisible ? '◉' : '○'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}