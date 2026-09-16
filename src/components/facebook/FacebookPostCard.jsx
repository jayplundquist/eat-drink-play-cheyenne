import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send, X, Sparkles } from 'lucide-react';
import ImageModePicker from './ImageModePicker';
import { toast } from 'sonner';

export default function FacebookPostCard({ post, onPublish, onReject, onUpdate, publishing }) {
  const [text, setText] = useState(post.post_text);
  const [imageMode, setImageMode] = useState(post.image_mode || 'none');
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Enter an image prompt first');
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: aiPrompt });
      setImageUrl(res.url);
      toast.success('Image generated');
    } catch (err) {
      toast.error('Image generation failed: ' + err.message);
    }
    setGenerating(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setImageUrl(res.file_url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handlePublish = () => {
    if (!text.trim()) return toast.error('Post text is required');
    onUpdate(post.id, { post_text: text, image_mode: imageMode, image_url: imageUrl }, () =>
      onPublish(post.id)
    );
  };

  const sourceLabel = {
    friday_recommendation: 'Friday Rec',
    weekly_digest: 'Weekly Digest',
    custom_prompt: 'Custom Prompt',
    manual: 'Manual',
  }[post.source_type] || post.source_type;

  return (
    <Card className="mb-4 border-2 border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
              {sourceLabel}
            </CardTitle>
            {post.prompt && (
              <p className="text-xs text-stone-500 mt-1 italic">"{post.prompt}"</p>
            )}
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">{post.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-stone-700">Post Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1"
            rows={6}
          />
          <p className="text-xs text-stone-400 mt-1">{text.length} characters</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-2">Image</label>
          <ImageModePicker value={imageMode} onChange={setImageMode} />
          {imageMode === 'ai_generated' && (
            <div className="mt-2 flex gap-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the image to generate..."
                className="flex-1"
              />
              <Button onClick={handleGenerate} disabled={generating} variant="outline">
                <Sparkles className="w-4 h-4 mr-1" />
                {generating ? '...' : 'Generate'}
              </Button>
            </div>
          )}
          {imageMode === 'uploaded' && (
            <div className="mt-2">
              <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </div>
          )}
          {imageUrl && imageMode !== 'none' && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 w-full max-h-48 object-cover rounded-md border border-amber-200"
            />
          )}
        </div>

        {post.error_message && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">⚠ {post.error_message}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            <Send className="w-4 h-4 mr-1" />
            Publish to Facebook
          </Button>
          <Button variant="outline" onClick={() => onReject(post.id)}>
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}