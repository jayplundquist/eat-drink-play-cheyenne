import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CONSEQUENCES = [
  'Every review, boot rating and boot visit you logged is deleted.',
  'All of your saved favorites are removed.',
  'Your garage sale listings, saved sales and route plans are deleted.',
  'Your follows and notifications are cleared.',
  'This cannot be undone — there is no restore.',
];

export default function AccountDeletionCard() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await base44.functions.invoke('deleteAccount', { confirm: true });
      if (response.data?.error) throw new Error(response.data.error);
      toast.success('Your data has been deleted. Signing you out…');
      setOpen(false);
      setTimeout(() => base44.auth.logout(), 1400);
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast.error(error?.message || 'We could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 text-lg sm:text-xl">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          Delete my account
        </CardTitle>
        <CardDescription>
          Permanently remove your account data from Eat, Drink, Play Cheyenne.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-stone-600">
          {CONSEQUENCES.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-red-600">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-stone-600">
          Your sign-in record is removed by an admin once this request is processed. You will be
          signed out immediately.
        </p>

        <Dialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Delete my account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account data?</DialogTitle>
              <DialogDescription>
                This deletes your reviews, ratings, favorites, listings, routes and notifications
                right away. It cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="min-h-[44px]"
              >
                Keep my account
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-700 hover:bg-red-800 text-white min-h-[44px]"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}