import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Navigation, Footprints, TreePine, Clock, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRAILS = [
  {
    id: 'dry-creek',
    name: 'Dry Creek Greenway',
    color: '#166534',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    length: '8 miles (one way)',
    surface: 'Paved concrete',
    difficulty: 'Easy',
    emoji: '🌿',
    description: 'The backbone of the Cheyenne Greenway system, running east–west through the heart of the city along Dry Creek. Connects western neighborhoods near I-25 all the way out to US-30 on the east side.',
    connects: ['Western Hills Park (West Terminal)', 'Lions Park & Sloan\'s Lake', 'Mylar Park', 'Kiwanis Park', 'Dry Creek Park (East Terminal)'],
  },
  {
    id: 'crow-creek',
    name: 'Crow Creek Greenway',
    color: '#7c3aed',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    length: '~3.5 miles',
    surface: 'Paved concrete',
    difficulty: 'Easy',
    emoji: '🌊',
    description: 'Follows the natural corridor of Crow Creek through the south-central part of Cheyenne, linking community parks and downtown access points. Great for a quieter, shaded walk.',
    connects: ['Martin Luther King Jr. Park', 'Holliday Park & Lake Minnehaha', 'Big Boy Steam Engine #4004 plaza'],
  },
  {
    id: 'allison-draw',
    name: 'Allison Draw Greenway',
    color: '#0d9488',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800',
    length: '~5 miles',
    surface: 'Paved concrete',
    difficulty: 'Easy to Moderate',
    emoji: '🏞️',
    description: 'Runs north–south through the western and southern parts of Cheyenne, connecting the downtown area to the LCCC campus. Passes through a mix of open space, neighborhoods, and park amenities.',
    connects: ['MLK Jr. Park (North)', 'Clear Creek Park', 'Dutcher Field / Airport Pkwy', 'LCCC Campus (South Terminal)'],
  },
  {
    id: 'sun-valley',
    name: 'Sun Valley & East Cheyenne',
    color: '#b45309',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    length: '~4 miles',
    surface: 'Paved concrete',
    difficulty: 'Easy',
    emoji: '☀️',
    description: 'Eastern connector paths linking the Sun Valley neighborhood to the Dry Creek trail and Dell Range corridor. Popular with cyclists and families for its open, sunny terrain.',
    connects: ['Sun Valley Park', 'Dry Creek East Terminal', 'Dell Range Boulevard corridor', 'Kiwanis Park'],
  },
];

const TRAILHEADS = [
  { name: 'Lions Park',               label: 'Central Hub',           trail: 'Dry Creek',     icon: '🦁', highlights: 'Sloan\'s Lake, Botanic Gardens, paddle boats' },
  { name: 'Western Hills Park',        label: 'NW Trail Start',        trail: 'Dry Creek',     icon: '🏔️', highlights: '8-mile western terminus, near I-25' },
  { name: 'Dry Creek Park',            label: 'East Trail End',        trail: 'Dry Creek',     icon: '🏁', highlights: '8-mile eastern terminus near US-30' },
  { name: 'Mylar Park',                label: 'North-Central',         trail: 'Dry Creek',     icon: '🌳', highlights: 'Shaded loops, willow trees, playground' },
  { name: 'Kiwanis Park',              label: 'NE Connector',          trail: 'Dry Creek/East',icon: '🌾', highlights: 'Dell Range & Dry Creek junction area' },
  { name: 'Holliday Park',             label: 'Downtown Anchor',       trail: 'Crow Creek',    icon: '🚂', highlights: 'Big Boy #4004 steam engine, Lake Minnehaha' },
  { name: 'MLK Jr. Park',              label: 'West-Side Hub',         trail: 'Allison/Crow',  icon: '🕊️', highlights: 'Major junction, Crow + Allison Draw trails' },
  { name: 'Clear Creek Park',          label: 'South-Central',         trail: 'Allison Draw',  icon: '💧', highlights: 'Fitness equipment, open green space' },
  { name: 'Dutcher Field / Airport Pkwy', label: 'Midtown Link',      trail: 'Allison Draw',  icon: '✈️', highlights: 'Sports complex, airfield views' },
  { name: 'LCCC',                      label: 'South Terminal',        trail: 'Allison Draw',  icon: '🎓', highlights: 'Community college connection, southeast terminus' },
  { name: 'Sun Valley Park',           label: 'East Neighborhood',     trail: 'Sun Valley',    icon: '🌻', highlights: 'Quiet paths, open terrain, family-friendly' },
  { name: 'Cahill Playground',         label: 'East-Side Hub',         trail: 'Dry Creek',     icon: '🛝', highlights: 'Sports fields, Dell Range corridor access' },
];

const FACTS = [
  { icon: '🛤️', label: 'Total Trail Length', value: 'Over 20 miles of paved paths' },
  { icon: '🚴', label: 'Activities', value: 'Walking, running, cycling, rollerblading' },
  { icon: '🐾', label: 'Pet Friendly', value: 'Leashed dogs welcome on all paths' },
  { icon: '♿', label: 'Accessibility', value: 'All paved surfaces, ADA accessible' },
  { icon: '🕐', label: 'Open Hours', value: 'Dawn to dusk, year-round' },
  { icon: '💲', label: 'Cost', value: 'Free – public park system' },
];

export default function GreenwayInfo() {
  return (
    <div className="min-h-screen bg-amber-50">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-green-900 via-green-800 to-teal-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-[200px] flex items-center justify-center pointer-events-none select-none">
          🌿
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-700/60 border border-green-400/40 rounded-full px-4 py-1.5 text-sm font-medium text-green-200 mb-5">
            <TreePine className="w-4 h-4" /> Cheyenne's Urban Trail Network
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: 'Rye, serif' }}>
            Greater Cheyenne Greenway
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Over 20 miles of paved, interconnected trails winding through parks, creekbeds, and neighborhoods across the Magic City — all free and open year-round.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('GreenwayGuide')}>
              <Button className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-base px-8 py-6 rounded-xl shadow-xl border-2 border-amber-300">
                <MapPin className="w-5 h-5 mr-2" />
                Open Interactive Map
              </Button>
            </Link>
            <a href="https://www.cheyennecity.org/Your-Government/Departments/Planning-and-Development-Department/Informational-Maps" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="bg-transparent border-2 border-green-300/60 text-green-100 hover:bg-green-700/40 text-base px-8 py-6 rounded-xl">
                <Navigation className="w-5 h-5 mr-2" />
                Official City Map
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FACTS.map(f => (
            <div key={f.label} className="bg-white rounded-xl border-2 border-amber-200 p-4 text-center shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">{f.label}</p>
              <p className="text-sm text-stone-700 font-medium">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trail Segments */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <h2 className="text-2xl font-bold text-amber-900 mb-6" style={{ fontFamily: 'Rye, serif' }}>
          🗺️ Trail Segments
        </h2>
        <div className="space-y-5">
          {TRAILS.map(trail => (
            <div key={trail.id} className={`${trail.bg} border-2 ${trail.border} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{trail.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-stone-900" style={{ fontFamily: 'Rye, serif' }}>
                      {trail.name}
                    </h3>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${trail.badge}`}>
                      {trail.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-stone-500 mb-3">
                    <span className="flex items-center gap-1"><Footprints className="w-3.5 h-3.5" />{trail.length}</span>
                    <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5" />{trail.surface}</span>
                  </div>
                  <p className="text-sm text-stone-700 mb-4 leading-relaxed">{trail.description}</p>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: trail.color }}>Connects To</p>
                    <div className="flex flex-wrap gap-2">
                      {trail.connects.map(c => (
                        <span key={c} className="bg-white/70 border text-xs rounded-full px-2.5 py-1 text-stone-700" style={{ borderColor: trail.color + '55' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trailheads Grid */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <h2 className="text-2xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Rye, serif' }}>
          🥾 Trailhead Locations
        </h2>
        <p className="text-stone-500 text-sm mb-6">Tap any trailhead on the map to get walking directions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRAILHEADS.map(t => (
            <div key={t.name} className="bg-white rounded-xl border-2 border-amber-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl flex-shrink-0">{t.icon}</div>
              <div className="min-w-0">
                <p className="font-semibold text-amber-900 text-sm leading-tight">{t.name}</p>
                <p className="text-xs text-green-700 font-medium mb-1">{t.label} · <span className="text-stone-400">{t.trail}</span></p>
                <p className="text-xs text-stone-500 leading-snug">{t.highlights}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-green-800 to-teal-800 rounded-2xl p-8 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 text-[120px] flex items-center justify-center opacity-10 pointer-events-none select-none">🗺️</div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Rye, serif' }}>Ready to Hit the Trail?</h3>
            <p className="text-green-200 mb-6 text-sm">Open the live map for GPS tracking, trailhead info, and turn-by-turn directions.</p>
            <Link to={createPageUrl('GreenwayGuide')}>
              <Button className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-base px-10 py-6 rounded-xl shadow-xl border-2 border-amber-200">
                <MapPin className="w-5 h-5 mr-2" />
                Open the Greenway Map
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}