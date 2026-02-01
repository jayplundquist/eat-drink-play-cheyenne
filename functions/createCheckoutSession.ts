import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICES = {
  venue_claim: 'price_1SvudtGuyms0jVKHBjCYMWEV',
  venue_boost: 'price_1SvudtGuyms0jVKHy9nJZQ0J',
  review_boost: 'price_1SvudtGuyms0jVKHVfzFSuDp',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, venueId, reviewId } = await req.json();

    if (!type || !PRICES[type]) {
      return Response.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    const priceId = PRICES[type];
    const successUrl = `${new URL(req.url).origin}/?checkout_success=true`;
    const cancelUrl = `${new URL(req.url).origin}/`;

    const sessionData = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        type,
        user_email: user.email,
        ...(venueId && { venue_id: venueId }),
        ...(reviewId && { review_id: reviewId }),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    return Response.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});