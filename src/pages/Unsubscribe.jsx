import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Mail, Loader2 } from 'lucide-react';

export default function Unsubscribe() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (!emailParam) {
      setStatus('error');
      return;
    }
    setEmail(emailParam);
  }, []);

  const handleConfirm = async () => {
    setStatus('loading');
    try {
      await base44.functions.invoke('unsubscribeUser', { email });
      setConfirmed(true);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d97706' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      }}
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border-4 border-amber-800 p-8 text-center">
        <div
          className="text-2xl text-amber-900 mb-2"
          style={{ fontFamily: 'Rye, serif' }}
        >
          EAT, DRINK, PLAY CHEYENNE
        </div>
        <div className="w-16 h-1 bg-amber-700 mx-auto mb-6 rounded-full" />

        {status === 'loading' && !confirmed && (
          <>
            <Mail className="w-12 h-12 mx-auto text-amber-700 mb-4" />
            <h1 className="text-xl font-bold text-stone-800 mb-3">Unsubscribe from campaign emails?</h1>
            <p className="text-stone-600 text-sm mb-6">
              You'll stop receiving our weekly recommendation and digest emails. You'll still see
              in-app notifications when you're logged in.
            </p>
            <Button
              onClick={handleConfirm}
              className="bg-amber-800 hover:bg-amber-900 text-white w-full"
              size="lg"
            >
              Yes, unsubscribe me
            </Button>
          </>
        )}

        {status === 'loading' && confirmed && (
          <div className="py-8">
            <Loader2 className="w-10 h-10 mx-auto text-amber-700 animate-spin mb-4" />
            <p className="text-stone-600">Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-700" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-3">You're unsubscribed!</h1>
            <p className="text-stone-600 text-sm mb-6">
              You won't receive any more campaign emails from Eat, Drink, Play Cheyenne. You can
              still explore everything on the site anytime.
            </p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-amber-800 hover:bg-amber-900 text-white w-full" size="lg">
                Back to the site
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold text-stone-800 mb-3">Something went wrong</h1>
            <p className="text-stone-600 text-sm mb-6">
              We couldn't process your unsubscribe request. The link may be invalid or expired.
            </p>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="w-full" size="lg">
                Back to the site
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}