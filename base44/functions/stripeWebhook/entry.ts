import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return Response.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { type, user_email, venue_id, review_id } = session.metadata;

      const base44 = createClientFromRequest(req);

      // Handle venue claim
      if (type === 'venue_claim' && venue_id) {
        await base44.asServiceRole.entities.Venue.update(venue_id, {
          claimed_by: user_email,
        });
        console.log(`Venue ${venue_id} claimed by ${user_email}`);
      }

      // Handle venue boost
      if (type === 'venue_boost' && venue_id) {
        const boostExpiresDate = new Date();
        boostExpiresDate.setDate(boostExpiresDate.getDate() + 30);
        await base44.asServiceRole.entities.Venue.update(venue_id, {
          quick_draw_boost: true,
          boost_expires_date: boostExpiresDate.toISOString(),
        });
        console.log(`Venue ${venue_id} boosted until ${boostExpiresDate}`);
      }

      // Handle review boost
      if (type === 'review_boost' && review_id) {
        const boostExpiresDate = new Date();
        boostExpiresDate.setDate(boostExpiresDate.getDate() + 7);
        await base44.asServiceRole.entities.Rating.update(review_id, {
          boosted_until: boostExpiresDate.toISOString(),
        });
        console.log(`Review ${review_id} boosted until ${boostExpiresDate}`);
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});