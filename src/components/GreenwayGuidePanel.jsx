import React from 'react';
import { MapPin, TreePine, Car, Utensils } from 'lucide-react';

/**
 * Crawlable, keyword-rich textual guide content for the Greenway page.
 * Always rendered in the DOM so search engines can read it; visually
 * toggled open/closed by the parent.
 */
const TRAILS = [
  {
    name: 'Dry Creek Greenway',
    miles: '~8 miles',
    description: 'The longest and most popular corridor, following Dry Creek from Western Hills Park near I-25 all the way east to Dry Creek Park by US 30. Paved, flat, and family-friendly with shade from willow trees.',
    parking: ['Western Hills Park (northwest terminus)', 'Lions Park (central hub)', 'Mylar Park', 'Dry Creek Park (east terminus)'],
    nearbyFood: 'Lions Park is walking distance from downtown Cheyenne restaurants; the east end is near dining along Dell Range.',
  },
  {
    name: 'Allison Draw Greenway',
    miles: '~5 miles',
    description: 'A southeast corridor following Allison Draw from the LCCC campus up through neighborhood greenways. Quieter and less crowded, ideal for a peaceful morning walk or bike ride.',
    parking: ['LCCC campus (southeast terminus)', 'Cahill Playground area'],
    nearbyFood: 'Short drive to restaurants along Yellowstone Road and the LCCC vicinity.',
  },
  {
    name: 'Crow Creek Greenway',
    miles: '~4 miles',
    description: 'Follows Crow Creek through Martin Luther King Jr. Park and connects toward the downtown core. Scenic creek views and a great shortcut between west-side neighborhoods and downtown.',
    parking: ['Martin Luther King Jr. Park', 'Holliday Park'],
    nearbyFood: 'Downtown Cheyenne bars and restaurants are within a few blocks of the Holliday Park trailhead.',
  },
  {
    name: 'Sun Valley Greenway',
    miles: '~3 miles',
    description: 'A quiet neighborhood path running parallel to the eastern railroad corridor through Sun Valley Park. Flat, open, and perfect for a short easy loop.',
    parking: ['Sun Valley Park'],
    nearbyFood: 'Food truck stops and casual dining a short drive away on East Lincolnway.',
  },
  {
    name: 'Cheyenne Greenway (main spine)',
    miles: 'varies',
    description: 'The connecting spine linking the named corridors above into a single 47-mile paved network through Lions Park, Holliday Park, the Botanic Gardens, Sloan\'s Lake, and the LCCC campus — all free and open year-round.',
    parking: ['Lions Park', 'Holliday Park', 'Botanic Gardens', 'Sloan\'s Lake'],
    nearbyFood: 'Multiple trailheads sit within walking distance of downtown Cheyenne dining and coffee shops.',
  },
];

export default function GreenwayGuidePanel({ open, onClose }) {
  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-[1002] w-full sm:w-96 bg-stone-50 shadow-2xl border-l-2 border-amber-300 overflow-y-auto transition-transform duration-300"
      style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      aria-hidden={!open}
    >
      <div className="sticky top-0 bg-amber-900 text-amber-50 px-5 py-4 flex items-center justify-between z-10">
        <h1 className="text-lg font-bold" style={{ fontFamily: 'Rye, serif' }}>
          <TreePine className="inline w-5 h-5 mr-2" />
          Cheyenne Greenway Guide
        </h1>
        <button onClick={onClose} className="text-amber-200 hover:text-white" aria-label="Close guide">
          ✕
        </button>
      </div>

      <div className="px-5 py-6 space-y-6 text-stone-700">
        <p className="leading-relaxed">
          The Greater Cheyenne Greenway is a <strong>47-mile paved, interconnected trail network</strong> winding
          through Cheyenne's parks, creek corridors, and neighborhoods. All trails are free, open year-round,
          and perfect for walking, running, and biking. Use this guide to find parking, trail access, and
          nearby food before or after your route.
        </p>

        {TRAILS.map(trail => (
          <section key={trail.name} className="border-b border-amber-200 pb-5">
            <h2 className="text-xl font-bold text-amber-900 mb-1" style={{ fontFamily: 'Rye, serif' }}>
              {trail.name}
            </h2>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              {trail.miles}
            </p>
            <p className="text-sm leading-relaxed mb-3">{trail.description}</p>

            <h3 className="text-sm font-bold text-stone-800 mb-1 flex items-center gap-1">
              <Car className="w-4 h-4 text-amber-700" /> Parking & Trail Access
            </h3>
            <ul className="text-sm text-stone-600 list-disc list-inside mb-3 space-y-0.5">
              {trail.parking.map(p => <li key={p}>{p}</li>)}
            </ul>

            <h3 className="text-sm font-bold text-stone-800 mb-1 flex items-center gap-1">
              <Utensils className="w-4 h-4 text-amber-700" /> Nearby Food
            </h3>
            <p className="text-sm text-stone-600">{trail.nearbyFood}</p>
          </section>
        ))}

        <section className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-base font-bold text-green-900 mb-2 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> Plan a Short Walk
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            New to the Greenway? Start at <strong>Lions Park</strong> for a flat, scenic loop around Sloan's
            Lake with botanic gardens, paddle boats, and downtown restaurants within a 10-minute walk. Or try
            the <strong>Holliday Park</strong> trailhead for a downtown-anchored stroll past the Big Boy Steam
            Engine and Lake Minnehaha.
          </p>
        </section>
      </div>
    </div>
  );
}