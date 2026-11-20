import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Deletes everything the signed-in user created or saved, then tells the admins
// so the sign-in record itself can be removed (the platform owns that record).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return Response.json({ error: 'Confirmation is required' }, { status: 400 });
    }

    const email = user.email;
    const userId = user.id;

    // Venue ratings feed the venue's aggregate, so collect them before deleting.
    const myRatings = await base44.asServiceRole.entities.Rating.filter({ user_email: email });
    const ratedVenueIds = [...new Set(myRatings.map((r) => r.venue_id).filter(Boolean))];

    const deletions = [
      ['Favorite', { user_email: email }],
      ['Rating', { user_email: email }],
      ['Follow', { user_email: email }],
      ['Follow', { following_email: email }],
      ['Notification', { recipient_email: email }],
      ['ReviewReaction', { user_email: email }],
      ['CommentReaction', { user_email: email }],
      ['BootVisit', { user_email: email }],
      ['ClaimRequest', { user_email: email }],
      ['GarageSaleReport', { reporter_email: email }],
      ['ReviewReport', { reporter_email: email }],
      ['GarageSale', { created_by_id: userId }],
      ['GarageSaleFavorite', { created_by_id: userId }],
      ['GarageSaleRoute', { created_by_id: userId }],
    ];

    const results = await Promise.allSettled(
      deletions.map(([entity, query]) => base44.asServiceRole.entities[entity].deleteMany(query))
    );

    // Recalculate the affected venues' rating totals.
    const recalculated = await Promise.allSettled(
      ratedVenueIds.map(async (venueId) => {
        const remaining = await base44.asServiceRole.entities.Rating.filter({ venue_id: venueId });
        const rating_count = remaining.length;
        const rating_sum = remaining.reduce((sum, r) => sum + (r.boots || 0), 0);
        await base44.asServiceRole.entities.Venue.update(venueId, { rating_count, rating_sum });
        return venueId;
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;

    // Let the admins finish removing the account itself.
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    await Promise.allSettled(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: 'Account deletion requested',
          body: `${user.full_name || 'A member'} (${email}) deleted their account data from the app.\n\nTheir reviews, favorites, garage sales, routes, visits and notifications have been removed. Please delete the sign-in record for ${email} to finish the request.`,
        })
      )
    );

    console.log(`Account data deleted for ${email}; ${ratedVenueIds.length} venues recalculated; ${failed} cleanup calls failed`);

    return Response.json({
      success: true,
      deleted_entities: deletions.length - failed,
      venues_recalculated: recalculated.filter((r) => r.status === 'fulfilled').length,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}