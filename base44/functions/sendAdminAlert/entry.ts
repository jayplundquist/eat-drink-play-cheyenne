import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, user_email, consecutive_days, review_count, wagon_name, venue_id } = await req.json();

    // Vendor-triggered alert: a chuck wagon just uploaded/replaced a branded logo pin.
    // Any authenticated vendor can fire this; the admin reviews after the fact.
    if (type === 'branded_pin_logo') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const origin = new URL(req.url).origin;
      const reviewUrl = `${origin}/EditVenue?id=${venue_id}`;
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          type: 'branded_pin_logo',
          title: `New logo submitted for ${wagon_name}`,
          message: `A branded map-pin logo was uploaded for "${wagon_name}". Review it and revoke if needed: ${reviewUrl}`,
          related_id: venue_id,
          actor_email: user_email || user.email,
        });
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `New logo submitted for ${wagon_name}`,
          body: `A branded map-pin logo was uploaded for "${wagon_name}".\n\nReview and revoke if needed: ${reviewUrl}`,
        }).catch((e) => console.error('Email failed:', e));
      }
      console.log(`Branded pin logo alert sent for venue ${venue_id}`);
      return Response.json({ success: true });
    }

    // Everything else is admin-only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'excessive_reviews') {
      // Get all admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

      // Send email to each admin
      for (const admin of admins) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Alert: Excessive Review Activity - ${user_email}`,
          body: `User ${user_email} has posted reviews on ${consecutive_days} consecutive days (${review_count} total reviews).\n\nPlease review their activity for potential spam or abuse.`
        });
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Admin alert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});