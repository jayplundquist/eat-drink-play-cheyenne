// Builds an SEO-friendly URL for a venue when slug data is available,
// falling back to the legacy id-based URL so nothing breaks during migration.
export function getVenueUrl(venue) {
  if (!venue) return '/VenueDetails';
  const slug = venue.manual_slug || venue.slug;
  const category = venue.primary_category || (venue.categories && venue.categories[0]) || 'venue';
  if (slug) return `/${category}/${slug}`;
  return `/VenueDetails?id=${venue.id}`;
}

export function getVenueCategoryPlural(category) {
  const map = {
    restaurant: 'restaurants',
    bar: 'bars',
    brewery: 'breweries',
    music_hall: 'music-halls',
    activity: 'activities',
    recreation: 'recreation',
    souvenir_shopping: 'shopping',
    food_trucks: 'food-trucks',
  };
  return map[category] || category || 'venues';
}