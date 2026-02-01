import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function NotificationManager({ user }) {
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribers = [];

    // Subscribe to review reactions
    const reactionUnsubscribe = base44.entities.ReviewReaction.subscribe((event) => {
      if (event.type === 'create') {
        const reaction = event.data;
        
        // Fetch the rating to get review author and venue info
        base44.entities.Rating.list().then(ratings => {
          const rating = ratings.find(r => r.id === reaction.rating_id);
          if (rating && rating.user_email === user.email && rating.user_email !== reaction.user_email) {
            const actor = reaction.user_email.split('@')[0];
            const message = `${actor} reacted to your review with ${reaction.reaction_type.replace('_', ' ')}`;
            
            // Show in-app toast
            toast.success(message, { duration: 4000 });
            
            // Send browser push notification
            sendBrowserNotification('Review Activity', message);
            
            // Save notification to database
            base44.entities.Notification.create({
              recipient_email: rating.user_email,
              type: 'review_reaction',
              title: 'Review Activity',
              message,
              related_id: reaction.rating_id,
              actor_email: reaction.user_email
            });
          }
        });
      }
    });
    unsubscribers.push(reactionUnsubscribe);

    // Subscribe to new ratings
    const ratingUnsubscribe = base44.entities.Rating.subscribe((event) => {
      if (event.type === 'create') {
        const newRating = event.data;
        
        // Fetch venue to get owner
        base44.entities.Venue.list().then(venues => {
          const venue = venues.find(v => v.id === newRating.venue_id);
          if (venue && venue.claimed_by && venue.claimed_by === user.email && venue.claimed_by !== newRating.user_email) {
            const actor = newRating.user_email.split('@')[0];
            const message = `${actor} left a new ${newRating.boots}-boot review on ${venue.name}`;
            
            // Show in-app toast
            toast.info(message, { duration: 4000 });
            
            // Send browser push notification
            sendBrowserNotification('New Review', message);
            
            // Save notification to database
            base44.entities.Notification.create({
              recipient_email: venue.claimed_by,
              type: 'new_review_on_venue',
              title: 'New Review',
              message,
              related_id: newRating.venue_id,
              actor_email: newRating.user_email
            });
          }
        });
      }
    });
    unsubscribers.push(ratingUnsubscribe);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  return null;
}

function sendBrowserNotification(title, message) {
  // Check if browser supports notifications and user has granted permission
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e9c14c196b53cce1321b1/82ae3fc32_image.png',
      });
    } else if (Notification.permission !== 'denied') {
      // Request permission if not denied
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e9c14c196b53cce1321b1/82ae3fc32_image.png',
          });
        }
      });
    }
  }
}