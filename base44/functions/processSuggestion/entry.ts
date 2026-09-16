import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const VENUE_PROMPT = (text) => `A user of "Eat, Drink, Play Cheyenne" (a local discovery guide for Cheyenne, Wyoming) submitted the following suggestion:

"""
${text}
"""

Step 1 — Classify it:
- "venue" = the user is suggesting a specific place (restaurant, bar, brewery, food truck, activity, shop, etc.) to add to the guide.
- "message" = general feedback, a feature request, a question, or anything that is NOT a specific place to add.

Step 2 — If it's a venue, search the web for that place IN CHEYENNE, WYOMING and extract its real details. Only return a venue if you can confidently identify a real, specific business located in or very near Cheyenne, WY. If you cannot confidently identify a real Cheyenne-area business, return type "message" instead so an admin can review it.

Return strict JSON matching the schema. For a venue, fill every field you can verify from web search:
- name: exact business name
- description: 1-3 sentence factual description
- address: street address in Cheyenne, WY
- phone, website
- categories: pick from ONLY these values: ["restaurant","bar","brewery","music_hall","activity","recreation","souvenir_shopping","food_trucks"]
- food_types (only if it serves food): pick from ONLY these values: ["asian","international","mexican","american","steaks","bbq","dessert","fine_dining","pizza"]
- price_range: one of ["Free","$","$$","$$$","$$$$"]
- image_url: a real, publicly accessible image URL of the business (its logo, storefront, or a photo). Leave empty string if you cannot find one.
- confidence: 0-1 how sure you are this is a real, correctly-identified Cheyenne-area business.

For a message, leave the venue fields empty/default.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const suggestionText = (body?.suggestion_text || '').toString().trim();
    const userEmail = (body?.user_email || 'anonymous').toString().trim();

    if (!suggestionText) {
      return Response.json({ error: 'Suggestion text is required' }, { status: 400 });
    }

    // Ask the LLM (with web search) to classify + extract venue details.
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: VENUE_PROMPT(suggestionText),
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['venue', 'message'] },
          name: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['restaurant','bar','brewery','music_hall','activity','recreation','souvenir_shopping','food_trucks']
            }
          },
          food_types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['asian','international','mexican','american','steaks','bbq','dessert','fine_dining','pizza']
            }
          },
          price_range: { type: 'string', enum: ['Free','$','$$','$$$','$$$$'] },
          image_url: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['type']
      }
    });

    const result = llmRes?.data || llmRes;
    const type = result?.type || 'message';

    // Message path — store as a Suggestion for admin review, same as before.
    if (type !== 'venue' || !result?.name) {
      await base44.asServiceRole.entities.Suggestion.create({
        user_email: userEmail,
        suggestion_text: suggestionText,
        status: 'pending'
      });
      return Response.json({
        type: 'message',
        message: 'Thanks! Your message was sent to the team.'
      });
    }

    // Venue path — de-duplicate by name (case-insensitive) before creating.
    const existing = await base44.asServiceRole.entities.Venue.filter({});
    const dupe = (existing || []).find(v =>
      (v.name || '').toLowerCase().trim() === (result.name || '').toLowerCase().trim()
    );
    if (dupe) {
      return Response.json({
        type: 'duplicate',
        venue_name: dupe.name,
        message: `${dupe.name} is already listed on the guide.`
      });
    }

    const categories = (result.categories && result.categories.length)
      ? result.categories
      : ['restaurant'];

    const created = await base44.asServiceRole.entities.Venue.create({
      name: result.name,
      description: result.description || '',
      address: result.address || '',
      phone: result.phone || '',
      website: result.website || '',
      image_url: result.image_url || '',
      categories,
      food_types: result.food_types || [],
      price_range: result.price_range || '',
      claimed_by: ''
    });

    return Response.json({
      type: 'venue',
      venue_name: created.name,
      venue_id: created.id,
      confidence: result.confidence ?? null,
      message: `We found and added ${created.name} to the guide!`
    });
  } catch (error) {
    console.error('processSuggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}