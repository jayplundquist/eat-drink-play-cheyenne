import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { venueId } = await req.json();

    // Get all user's reviews
    const allUserReviews = await base44.asServiceRole.entities.Rating.filter({ user_email: user.email });

    // Check for review on this venue today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReview = allUserReviews.find(r => {
      const reviewDate = new Date(r.created_date);
      reviewDate.setHours(0, 0, 0, 0);
      return r.venue_id === venueId && reviewDate.getTime() === today.getTime();
    });

    if (todayReview) {
      return Response.json({ 
        canPost: false, 
        reason: 'You have already posted a review for this venue today. You can update your existing review instead.' 
      });
    }

    // Check consecutive days (last 7 days of reviews)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReviews = allUserReviews.filter(r => {
      const reviewDate = new Date(r.created_date);
      return reviewDate >= sevenDaysAgo;
    });

    // Get unique review dates
    const reviewDates = new Set();
    recentReviews.forEach(r => {
      const date = new Date(r.created_date);
      date.setHours(0, 0, 0, 0);
      reviewDates.add(date.getTime());
    });

    // Sort dates and find longest consecutive streak
    const sortedDates = Array.from(reviewDates).sort((a, b) => a - b);
    let maxConsecutiveDays = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        maxConsecutiveDays = Math.max(maxConsecutiveDays, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // If 3+ consecutive days, alert admins
    if (maxConsecutiveDays >= 3) {
      try {
        await base44.asServiceRole.functions.invoke('sendAdminAlert', {
          type: 'excessive_reviews',
          user_email: user.email,
          consecutive_days: maxConsecutiveDays,
          review_count: allUserReviews.length
        });
      } catch (e) {
        console.error('Failed to send admin alert:', e);
      }
    }

    return Response.json({ 
      canPost: true,
      consecutiveDays: maxConsecutiveDays,
      totalReviews: allUserReviews.length
    });

  } catch (error) {
    console.error('Review validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});