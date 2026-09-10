import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { unsubscribeLink } from '../../shared/campaignEmails.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const { campaign_id } = body as any;
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // 1. Load and verify the campaign
    const campaign = await base44.asServiceRole.entities.NotificationCampaign.get(campaign_id);
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if (campaign.status !== 'approved') {
      return Response.json({ error: `Campaign status is ${campaign.status}, not approved` }, { status: 400 });
    }
    console.log(`Sending campaign ${campaign.id} (${campaign.type})`);

    // 2. Get all users, filter out opt-outs
    const allUsers = await base44.asServiceRole.entities.User.list('email', 500);
    const eligible = allUsers.filter((u) => u.email && !u.email_opt_out);
    console.log(`Eligible recipients: ${eligible.length} of ${allUsers.length} users`);

    // 3. Fan out — notifications + emails in batches
    const BATCH = 5;
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < eligible.length; i += BATCH) {
      const chunk = eligible.slice(i, i + BATCH);
      await Promise.all(chunk.map(async (u) => {
        try {
          // In-app notification
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: u.email,
            type: campaign.type,
            title: campaign.notification_title,
            message: campaign.notification_message,
            related_id: campaign.related_venue_id || campaign.id,
            read: false,
          });

          // Email — rebuild HTML with this recipient's unsubscribe link
          // The stored email_html has a placeholder footer; replace the generic
          // unsubscribe link with the per-recipient one.
          const perRecipientHtml = campaign.email_html.replace(
            /\/unsubscribe\?email=[^"]*/g,
            `/unsubscribe?email=${unsubscribeLink(u.email).split('email=')[1]}`
          );

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            subject: campaign.email_subject,
            html: perRecipientHtml,
          });
          sent++;
        } catch (err) {
          failed++;
          console.error(`Failed for ${u.email}:`, err.message);
        }
      }));
      // Small delay between batches to avoid rate limits
      if (i + BATCH < eligible.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    console.log(`Campaign ${campaign.id} sent — ${sent} ok, ${failed} failed`);

    // 4. Mark campaign as sent
    await base44.asServiceRole.entities.NotificationCampaign.update(campaign.id, {
      status: 'sent',
      sent_date: new Date().toISOString(),
      recipient_count: sent,
    });

    return Response.json({
      success: true,
      sent,
      failed,
      total_eligible: eligible.length,
      total_users: allUsers.length,
    });
  } catch (error) {
    console.error('sendApprovedCampaign error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}