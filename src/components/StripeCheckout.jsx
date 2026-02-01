import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export const initiateCheckout = async (type, venueId = null, reviewId = null) => {
  // Check if running in iframe
  if (window.self !== window.top) {
    toast.error('Checkout only works from the published app. Please open it in a new tab.');
    return;
  }

  try {
    const payload = { type };
    if (venueId) payload.venueId = venueId;
    if (reviewId) payload.reviewId = reviewId;

    const response = await base44.functions.invoke('createCheckoutSession', payload);
    const { url } = response.data;

    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    toast.error('Failed to start checkout. Please try again.');
  }
};