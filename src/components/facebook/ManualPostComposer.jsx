import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';
import ImageModePicker from './ImageModePicker';
import { toast } from 'sonner';

export default function ManualPostComposer({ onPublished }) {
  const [text, setText] = useState('');
  const [imageMode, setImageMode] = useState('none');
  const [imageUrl, setImageUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  const handlePublish = async () => {
    if (!text.trim()) return toast.error('Post text is required');
    setPublishing(true);
    try {
      const post = await base44.entities.FacebookPost.create({
        source_type: 'manual',
        post_text: text,
        image_mode: imageMode,
        image_url: imageUrl,
        status: 'approved',
      });
      await base44.functions.invoke('publishFacebookPost', { post_id: post.id });
      toast.success('Posted to Facebook!');
      setText('');
      setImageUrl('');
      setAiPrompt('');
      setImageMode('none');
      onPublished();
    } catch (err) {
      toast.error('Publish failed: ' + (err.message || 'Unknown error'));
    }
    setPublishing(false);
  };

  return (
    <Card className="mb-6 border-2 border-amber-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
          ✍️ Write a Manual Post
        </CardTitle>
        <p className="text-sm text-stone-600">
          Write your own post and publish it immediately — no approval needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your Facebook post here..."
            rows={5}
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
        <Button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          <Send className="w-4 h-4 mr-1" />
          {publishing ? 'Publishing...' : 'Publish Now'}
        </Button>
      </CardContent>
    </Card>
  );
}