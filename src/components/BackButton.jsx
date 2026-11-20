import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Back control for child/detail screens: goes back in history, and falls back
 * to the home page when the screen was opened directly (no history to pop).
 */
export default function BackButton({ label = 'Back', className, variant = 'outline', size = 'sm' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      aria-label={label}
      className={cn('min-h-[44px] md:min-h-0', className)}
    >
      <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
      {label}
    </Button>
  );
}