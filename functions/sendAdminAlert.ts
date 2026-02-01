import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow service role calls or admin users
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, user_email, consecutive_days, review_count } = await req.json();

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