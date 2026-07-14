import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

function createSlug(name: string): string {
  return (name || 'venue')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const venues = await base44.asServiceRole.entities.Venue.list('name', 500);
    const usedSlugs = new Set<string>();
    const updates: Array<{ id: string; slug: string; primary_category: string }> = [];

    for (const venue of venues) {
      // Respect an existing unique slug
      if (venue.slug && !usedSlugs.has(venue.slug)) {
        usedSlugs.add(venue.slug);
        // Still backfill primary_category if missing
        if (!venue.primary_category) {
          const primary_category = (venue.categories && venue.categories.length > 0)
            ? venue.categories[0]
            : 'venue';
          updates.push({ id: venue.id, slug: venue.slug, primary_category });
        }
        continue;
      }

      const baseSlug = createSlug(venue.name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(finalSlug);

      const primary_category = (venue.categories && venue.categories.length > 0)
        ? venue.categories[0]
        : 'venue';

      updates.push({ id: venue.id, slug: finalSlug, primary_category });
    }

    if (updates.length === 0) {
      return Response.json({ message: 'No venues needed migration.' });
    }

    await base44.asServiceRole.entities.Venue.bulkUpdate(updates);

    return Response.json({
      message: `Migration complete. Updated ${updates.length} venues.`,
      updated: updates
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});