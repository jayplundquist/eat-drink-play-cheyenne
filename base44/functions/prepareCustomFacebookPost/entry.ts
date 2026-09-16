import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { SITE_URL } from '../../shared/campaignEmails.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { prompt } = body;
    if (!prompt || !prompt.trim()) {
      return Response.json({ error: 'prompt required' }, { status: 400 });
    }

    // 1. Gather live site data for the AI to draw from
    const [venues, garageSales, chuckWagonStops] = await Promise.all([
      base44.asServiceRole.entities.Venue.list('name', 500),
      base44.asServiceRole.entities.GarageSale.list('created_date', 200),
      base44.asServiceRole.entities.ChuckWagonStop.list('-created_date', 100),
    ]);

    const openVenues = venues.filter((v) => !v.permanently_closed);
    const liveFoodTrucks = venues.filter(
      (v) => (v.categories || []).includes('food_trucks') && v.is_live && !v.permanently_closed
    );
    const activeSales = garageSales.filter((s) => s.status === 'active');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newThisWeek = openVenues.filter(
      (v) => v.created_date && v.created_date >= weekAgo
    );
    const todayStr = now.toISOString().slice(0, 10);
    const upcomingStops = chuckWagonStops.filter(
      (s) =>
        s.status === 'active' &&
        s.is_public &&
        (s.stop_dates || []).some((d) => d >= todayStr)
    );

    const siteContext = {
      totalVenues: openVenues.length,
      newThisWeek: newThisWeek.map((v) => v.name),
      liveFoodTrucks: liveFoodTrucks.map((v) => ({
        name: v.name,
        location: v.live_location_label,
        note: v.live_note,
      })),
      activeGarageSales: activeSales.length,
      garageSaleTitles: activeSales.slice(0, 10).map((s) => s.title),
      upcomingChuckWagonStops: upcomingStops.slice(0, 10).map((s) => ({
        wagon: s.venue_name,
        location: s.location_label,
        dates: s.stop_dates,
      })),
      siteUrl: SITE_URL,
    };

    // 2. Ask AI to compose the post
    const llmPrompt = `You are writing a Facebook post for the "Eat, Drink, Play Cheyenne" page — a local discovery platform for Cheyenne, Wyoming. The tone is friendly, engaging, and proudly Western (but not cheesy). Keep the post under 300 characters for best engagement. Use 1-2 emojis max. Include a call to action to visit the site.

The admin requested a post about: "${prompt}"

Here is live data from the site you can draw from:
${JSON.stringify(siteContext, null, 2)}

Write a single Facebook post that responds to the admin's request using this real data. If the request asks about something not in the data, write a general engaging post about exploring Cheyenne and mention the site URL. Return ONLY the post text, no quotes, no explanation. If a specific venue is clearly the focus, include its ID in suggested_venue_id; otherwise leave it empty.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          post_text: { type: 'string' },
          suggested_venue_id: { type: 'string' },
        },
      },
    });

    const postText = (llmRes.post_text || '').trim();
    const suggestedVenueId = (llmRes.suggested_venue_id || '').trim();

    // 3. Default image: if a featured venue has a photo, use it
    let imageMode = 'none';
    let imageUrl = '';
    let relatedVenueId = suggestedVenueId;
    if (suggestedVenueId) {
      const venue = openVenues.find((v) => v.id === suggestedVenueId);
      if (venue && venue.image_url) {
        imageMode = 'venue_photo';
        imageUrl = venue.image_url;
      }
    }

    // 4. Store as pending
    const post = await base44.asServiceRole.entities.FacebookPost.create({
      source_type: 'custom_prompt',
      prompt: prompt.trim(),
      post_text: postText,
      image_mode: imageMode,
      image_url: imageUrl,
      related_venue_id: relatedVenueId,
      status: 'pending',
    });

    console.log(`Composed custom Facebook post ${post.id} for prompt: ${prompt}`);

    return Response.json({
      success: true,
      post_id: post.id,
      post_text: postText,
      image_mode: imageMode,
    });
  } catch (error) {
    console.error('prepareCustomFacebookPost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}