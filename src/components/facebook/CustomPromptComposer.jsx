import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const EXAMPLES = [
  "Post what's new this week",
  'Post how many garage sales are open now',
  'Post look at these live food trucks',
];

export default function CustomPromptComposer({ onComposed }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompose = async () => {
    if (!prompt.trim()) return toast.error('Enter a prompt first');
    setLoading(true);
    try {
      await base44.functions.invoke('prepareCustomFacebookPost', { prompt });
      toast.success('Post composed — review it below');
      setPrompt('');
      onComposed();
    } catch (err) {
      toast.error('Compose failed: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <Card className="mb-6 border-2 border-amber-300 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
          ✨ Compose from a Prompt
        </CardTitle>
        <p className="text-sm text-stone-600">
          Describe what you want to post about. AI pulls live data from the site to write it.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Post what's new this week"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCompose()}
          />
          <Button
            onClick={handleCompose}
            disabled={loading}
            className="bg-amber-800 hover:bg-amber-900 text-white"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {loading ? 'Composing...' : 'Compose'}
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}