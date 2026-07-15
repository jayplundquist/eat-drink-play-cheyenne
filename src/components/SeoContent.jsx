import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getVenueUrl } from '@/lib/venueUrl';
import { MapPin, Coffee, Utensils, Wine, TreePine, Calendar, Music } from 'lucide-react';

/**
 * Crawlable, keyword-rich content sections for the homepage.
 * Renders as real HTML text so search engines can understand what
 * the site is about — a local guide to Cheyenne, WY.
 */
export default function SeoContent({ featuredVenues = [] }) {
  const restaurants = featuredVenues.filter(v => v.categories?.includes('restaurant')).slice(0, 4);
  const bars = featuredVenues.filter(v => v.categories?.includes('bar') || v.categories?.includes('brewery')).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12 text-stone-700">
      {/* Food & Drink */}
      <section>
        <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
          <Utensils className="inline w-6 h-6 mr-2 mb-1" />
          Find Food &amp; Drink in Cheyenne
        </h2>
        <p className="leading-relaxed mb-4">
          From hearty breakfast diners and chicken-fried steak to craft breweries and downtown cocktail bars,
          Cheyenne's dining scene blends classic Western comfort food with modern local favorites. Browse
          restaurants by cuisine — American, Mexican, Asian, BBQ, steakhouse, pizza, and fine dining — or
          discover food trucks, coffee shops, and sweet treats around the city.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/breakfast" className="bg-amber-100 text-amber-800 text-sm rounded-full px-3 py-1 font-medium hover:bg-amber-200">Breakfast</Link>
          <Link to="/bars" className="bg-amber-100 text-amber-800 text-sm rounded-full px-3 py-1 font-medium hover:bg-amber-200">Bars</Link>
          <Link to="/breweries" className="bg-amber-100 text-amber-800 text-sm rounded-full px-3 py-1 font-medium hover:bg-amber-200">Breweries</Link>
          <Link to="/things-to-do-tonight" className="bg-amber-100 text-amber-800 text-sm rounded-full px-3 py-1 font-medium hover:bg-amber-200">Things to Do Tonight</Link>
          <Link to="/greenway-walks" className="bg-amber-100 text-amber-800 text-sm rounded-full px-3 py-1 font-medium hover:bg-amber-200">Greenway Walks Near Food</Link>
        </div>
      </section>

      {/* Greenway */}
      <section>
        <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
          <TreePine className="inline w-6 h-6 mr-2 mb-1" />
          Explore the Greater Cheyenne Greenway
        </h2>
        <p className="leading-relaxed mb-4">
          Walk, run, or bike over 47 miles of paved, interconnected trails winding through Cheyenne's parks,
          creek corridors, and neighborhoods. The Greenway connects Lions Park, Holliday Park, the Botanic
          Gardens, Sloan's Lake, and the LCCC campus — all free and open year-round. Use our interactive
          map for trailhead parking, GPS tracking, and nearby restaurant stops before or after your route.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/greenway-walks" className="text-amber-700 font-semibold underline hover:text-amber-900">
            Greenway walks near food →
          </Link>
          <Link to={createPageUrl('GreenwayGuide')} className="text-amber-700 font-semibold underline hover:text-amber-900">
            Open the interactive Greenway map →
          </Link>
        </div>
      </section>

      {/* Things To Do */}
      <section>
        <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
          <Calendar className="inline w-6 h-6 mr-2 mb-1" />
          Things To Do Tonight in Cheyenne
        </h2>
        <p className="leading-relaxed mb-4">
          Looking for live music, trivia night, a watch party, or a date-night spot? Cheyenne offers live
          music halls, recreation centers, Western-themed attractions, and Frontier Days events throughout
          the year. Spin the Spur for a random pick, or filter by category to find exactly what's open near you.
        </p>
        <div className="flex flex-wrap gap-2">
          {['Live Music', 'Trivia', 'Watch Parties', 'Date Night', 'Family Fun', 'Frontier Days'].map(label => (
            <span key={label} className="bg-stone-100 text-stone-700 text-sm rounded-full px-3 py-1 font-medium">
              {label}
            </span>
          ))}
        </div>
        <p className="mt-4">
          <Link to="/things-to-do-tonight" className="text-amber-700 font-semibold underline hover:text-amber-900">
            Browse things to do tonight in Cheyenne →
          </Link>
        </p>
      </section>

      {/* Featured Spots */}
      {restaurants.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-4" style={{ fontFamily: 'Rye, serif' }}>
            <MapPin className="inline w-6 h-6 mr-2 mb-1" />
            Featured Local Spots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.map(venue => (
              <Link key={venue.id} to={getVenueUrl(venue)} className="block bg-white rounded-xl border border-amber-200 p-4 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-amber-900">{venue.name}</h3>
                <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                  {venue.description || `A local ${venue.categories?.[0] || 'spot'} in Cheyenne, Wyoming.`}
                </p>
                {venue.address && <p className="text-xs text-stone-400 mt-2">{venue.address}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About / Local Guide */}
      <section className="border-t border-amber-200 pt-8">
        <h2 className="text-2xl font-bold text-amber-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
          Your Local Guide to Cheyenne, Wyoming
        </h2>
        <div className="space-y-4 leading-relaxed">
          <p>
            Eat, Drink, Play Cheyenne is a community-built discovery platform for the Capital City of Wyoming.
            Whether you're a local looking for a new dinner spot, a visitor exploring during Cheyenne Frontier Days,
            or a family planning a Greenway afternoon, we help you find the best restaurants, bars, breweries,
            activities, and outdoor trails in Cheyenne.
          </p>
          <p>
            Every listing includes real details — hours, address, phone, website, price range, food types, and
            reviews from people who've been there. Save your favorites, rate spots with our boot rating system,
            collect Big Boot badges around town, and share your discoveries with the community.
          </p>
        </div>
      </section>
    </div>
  );
}