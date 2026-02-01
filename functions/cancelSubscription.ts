import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@18.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_customer_id) {
      return Response.json({ error: 'No active subscription' }, { status: 400 });
    }

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active'
    });

    // Cancel all active subscriptions
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    // Update user to remove premium status
    await base44.asServiceRole.auth.updateUser(user.id, {
      is_premium: false
    });

    return Response.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});