import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  buildFridayContent,
  SITE_URL,
} from '../../shared/campaignEmails.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled runs have no user token; manual admin triggers do.
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAdmin = true;
    } catch {}

    console.log(`Friday recommendation prep — admin:${isAdmin}, scheduled:${!isAdmin}`);

    // 1. Get all venues and recently-featured venue IDs (last ~8 weeks)
    const venues = await base44.asServiceRole.entities.Venue.list('name', 500);
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();
    const recentCampaigns = await base44.asServiceRole.entities.NotificationCampaign.filter({
      type: 'weekly_recommendation',
      status: 'sent',
    }, '-sent_date', 50);
    const recentlyFeaturedIds = new Set(
      recentCampaigns
        .filter((c) => c.sent_date && c.sent_date >= eightWeeksAgo)
        .map((c) => c.related_venue_id)
        .filter(Boolean)
    );
    console.log(`Found ${recentlyFeaturedIds.size} recently featured venue IDs`);

    // 2. Pick a venue — not permanently closed, not recently featured, prefer ones with images
    const eligible = venues.filter(
      (v) => !v.permanently_closed && !recentlyFeaturedIds.has(v.id)
    );
    const pool = eligible.length > 0 ? eligible : venues.filter((v) => !v.permanently_closed);
    if (pool.length === 0) {
      return Response.json({ error: 'No eligible venues found' }, { status: 400 });
    }
    // Prefer venues with images, pick randomly within that subset for rotation
    const withImages = pool.filter((v) => v.image_url);
    const chosenPool = withImages.length > 0 ? withImages : pool;
    const venue = chosenPool[Math.floor(Math.random() * chosenPool.length)];
    console.log(`Featured venue: ${venue.name}`);

    // 3. Build email + notification content
    const content = buildFridayContent(venue);
    const now = new Date().toISOString();

    // 4. Create the pending campaign
    const campaign = await base44.asServiceRole.entities.NotificationCampaign.create({
      name: `Friday Recommendation — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      type: 'weekly_recommendation',
      email_subject: content.emailSubject,
      email_html: content.emailHtmlBuilder(''), // template; sendApprovedCampaign rebuilds per-recipient
      notification_title: content.notificationTitle,
      notification_message: content.notificationMessage,
      related_venue_id: venue.id,
      status: 'pending_approval',
      scheduled_for: now,
    });
    console.log(`Created campaign ${campaign.id}`);

    // 5. Alert admins via in-app notification + email
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const manageUrl = `${SITE_URL}/ManageNotifications`;
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          type: 'weekly_recommendation',
          title: 'Friday campaign ready for review',
          message: `Featured venue: ${venue.name}. Review and approve before sending.`,
          related_id: campaign.id,
          read: false,
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Friday campaign ready for review: ${venue.name}`,
          html: `<p>A new Friday recommendation campaign is ready for your review.</p>
                 <p><strong>Featured venue:</strong> ${venue.name}</p>
                 <p><a href="${manageUrl}">Review &amp; approve on the admin page →</a></p>`,
          text: `A new Friday recommendation campaign is ready for review. Featured venue: ${venue.name}. Review and approve at ${manageUrl}`,
        });
      } catch (err) {
        console.error(`Failed to alert admin ${admin.email}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      campaign_id: campaign.id,
      venue: venue.name,
      admin_count: admins.length,
    });
  } catch (error) {
    console.error('prepareFridayRecommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}