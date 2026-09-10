import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  buildDigestContent,
  SITE_URL,
} from '../../shared/campaignEmails.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAdmin = true;
    } catch {}

    console.log(`Weekly digest prep — admin:${isAdmin}, scheduled:${!isAdmin}`);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Query new content from the last 7 days
    const [allVenues, garageSales, ratings, bootShares] = await Promise.all([
      base44.asServiceRole.entities.Venue.list('name', 500),
      base44.asServiceRole.entities.GarageSale.list('created_date', 200),
      base44.asServiceRole.entities.Rating.list('-created_date', 100),
      base44.asServiceRole.entities.BootShare.list('-shared_date', 50),
    ]);

    const newVenues = allVenues.filter(
      (v) => v.created_date && v.created_date >= sevenDaysAgo && !v.permanently_closed
    );
    const activeNewSales = garageSales.filter(
      (s) => s.created_date && s.created_date >= sevenDaysAgo && s.status === 'active'
    );
    const recentReviews = ratings
      .filter((r) => r.created_date && r.created_date >= sevenDaysAgo)
      .sort((a, b) => (b.boots || 0) - (a.boots || 0))
      .slice(0, 3);
    const recentBootShares = bootShares.filter(
      (b) => b.shared_date && b.shared_date >= sevenDaysAgo
    );

    console.log(`Digest content — venues:${newVenues.length}, sales:${activeNewSales.length}, reviews:${recentReviews.length}, boots:${recentBootShares.length}`);

    // 2. Build email + notification content
    const content = buildDigestContent({
      newVenues,
      garageSales: activeNewSales,
      topReviews: recentReviews,
      bootShares: recentBootShares,
    });
    const now = new Date().toISOString();

    // 3. Create the pending campaign
    const campaign = await base44.asServiceRole.entities.NotificationCampaign.create({
      name: `Weekly Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      type: 'weekly_digest',
      email_subject: content.emailSubject,
      email_html: content.emailHtmlBuilder(''),
      notification_title: content.notificationTitle,
      notification_message: content.notificationMessage,
      status: 'pending_approval',
      scheduled_for: now,
    });
    console.log(`Created campaign ${campaign.id}`);

    // 4. Alert admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const manageUrl = `${SITE_URL}/ManageNotifications`;
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          type: 'weekly_digest',
          title: 'Weekly digest ready for review',
          message: `${newVenues.length + activeNewSales.length + recentReviews.length + recentBootShares.length} new items this week. Review and approve.`,
          related_id: campaign.id,
          read: false,
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: 'Weekly digest ready for review',
          html: `<p>The weekly digest campaign is ready for your review.</p>
                 <p>${newVenues.length} new venues, ${activeNewSales.length} garage sales, ${recentReviews.length} top reviews, ${recentBootShares.length} boot shares.</p>
                 <p><a href="${manageUrl}">Review &amp; approve on the admin page →</a></p>`,
          text: `Weekly digest ready for review. ${newVenues.length} new venues, ${activeNewSales.length} garage sales, ${recentReviews.length} reviews, ${recentBootShares.length} boot shares. Review at ${manageUrl}`,
        });
      } catch (err) {
        console.error(`Failed to alert admin ${admin.email}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      campaign_id: campaign.id,
      stats: {
        newVenues: newVenues.length,
        garageSales: activeNewSales.length,
        reviews: recentReviews.length,
        bootShares: recentBootShares.length,
      },
      admin_count: admins.length,
    });
  } catch (error) {
    console.error('prepareWeeklyDigest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}