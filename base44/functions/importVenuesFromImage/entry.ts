import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Allowed enum values for the Venue schema — we sanitize the LLM output against
// these so an unexpected category string doesn't reject the whole batch.
const ALLOWED_CATEGORIES = [
  'restaurant', 'bar', 'brewery', 'music_hall',
  'activity', 'recreation', 'souvenir_shopping', 'food_trucks'
];
const ALLOWED_FOOD_TYPES = [
  'asian', 'international', 'mexican', 'american',
  'steaks', 'bbq', 'dessert', 'fine_dining', 'pizza'
];
const ALLOWED_PRICE = ['Free', '$', '$$', '$$$', '$$$$'];

const sanitizeCategories = (raw) => {
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const clean = list
    .map((c) => String(c).trim().toLowerCase())
    .filter((c) => ALLOWED_CATEGORIES.includes(c));
  return clean.length ? Array.from(new Set(clean)) : ['restaurant'];
};

const sanitizeFoodTypes = (raw) => {
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return list
    .map((c) => String(c).trim().toLowerCase())
    .filter((c) => ALLOWED_FOOD_TYPES.includes(c));
};

const sanitizePrice = (raw) => {
  const p = String(raw || '').trim();
  return ALLOWED_PRICE.includes(p) ? p : undefined;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Bulk import is an admin-only operation — guard it so non-admins can't
    // create venues by hitting the endpoint directly.
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const { file_url } = body;

    if (!file_url || typeof file_url !== 'string') {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    console.log(`Importing venues from image: ${file_url}`);

    // Use vision-capable LLM to read the list of businesses from the image and
    // return them as a structured array we can insert directly.
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a data-entry assistant for "Eat, Drink, Play Cheyenne", a local discovery platform for Cheyenne, Wyoming. The attached image shows a list of businesses (e.g. a directory, flyer, map, or sign). Extract EVERY distinct business you can read in the image as a venue.\n\nFor each business return:\n- name (required — the business name; skip entries that are clearly not a business)\n- address (street address if visible)\n- phone (if visible)\n- website (full URL if visible)\n- description (1-2 sentence description based only on what's in the image; if nothing is known, a brief neutral line)\n- primary_category (the single best category from: ${ALLOWED_CATEGORIES.join(', ')})\n- categories (array of all matching categories from the same list)\n- food_types (array from: ${ALLOWED_FOOD_TYPES.join(', ')} — only if it is a restaurant/food business)\n- price_range (one of: ${ALLOWED_PRICE.join(', ')} — only if clearly indicated)\n\nOnly include real businesses. Do not invent data not visible in the image. If you can read a business name but nothing else, still include it with empty strings for the unknown fields.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          venues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
                phone: { type: 'string' },
                website: { type: 'string' },
                description: { type: 'string' },
                primary_category: { type: 'string' },
                categories: { type: 'array', items: { type: 'string' } },
                food_types: { type: 'array', items: { type: 'string' } },
                price_range: { type: 'string' }
              },
              required: ['name']
            }
          }
        },
        required: ['venues']
      }
    });

    const rawVenues = Array.isArray(llmRes?.venues) ? llmRes.venues : [];
    console.log(`LLM extracted ${rawVenues.length} venues`);

    if (rawVenues.length === 0) {
      return Response.json({
        message: 'No businesses could be read from the image',
        created: 0,
        venues: []
      });
    }

    // Sanitize each venue against the schema enums and drop nameless entries.
    const cleanVenues = rawVenues
      .map((v) => {
        const name = String(v.name || '').trim();
        if (!name) return null;
        const categories = sanitizeCategories(v.categories?.length ? v.categories : v.primary_category);
        const venue = {
          name,
          categories,
          primary_category: v.primary_category && ALLOWED_CATEGORIES.includes(String(v.primary_category).toLowerCase())
            ? String(v.primary_category).toLowerCase()
            : categories[0]
        };
        const address = String(v.address || '').trim();
        if (address) venue.address = address;
        const phone = String(v.phone || '').trim();
        if (phone) venue.phone = phone;
        const website = String(v.website || '').trim();
        if (website) venue.website = website;
        const description = String(v.description || '').trim();
        if (description) venue.description = description;
        const foodTypes = sanitizeFoodTypes(v.food_types);
        if (foodTypes.length) venue.food_types = foodTypes;
        const price = sanitizePrice(v.price_range);
        if (price) venue.price_range = price;
        return venue;
      })
      .filter(Boolean);

    if (cleanVenues.length === 0) {
      return Response.json({
        message: 'No valid venues found (all were missing a name)',
        created: 0,
        venues: []
      });
    }

    const created = await base44.asServiceRole.entities.Venue.bulkCreate(cleanVenues);
    console.log(`Created ${created.length} venues`);

    return Response.json({
      message: `Imported ${created.length} of ${rawVenues.length} venues`,
      created: created.length,
      venues: created.map((v) => ({ id: v.id, name: v.name }))
    });
  } catch (error) {
    console.error('Bulk venue import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});