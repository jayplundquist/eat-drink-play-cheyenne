import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import BootRating from "../components/BootRating";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootIconUrl, setBootIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBootIconUrl(file_url);
      toast.success('Boot icon uploaded! Copy the URL to use it.');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Sign in required</h1>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-stone-300">
            Customize your Cheyenne Guide experience
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card className="bg-white border-stone-200">
          <CardHeader>
            <CardTitle>Customize Boot Rating Icon</CardTitle>
            <CardDescription>
              Upload a custom image to use as the boot rating icon throughout the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Preview */}
            <div>
              <Label className="mb-3 block">Current Boot Icon</Label>
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                <BootRating rating={5} size="lg" />
                <span className="text-sm text-stone-600">Preview of current rating display</span>
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-3">
              <Label htmlFor="boot-upload">Upload New Boot Icon</Label>
              <div className="flex gap-3">
                <Input
                  id="boot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button disabled={uploading} variant="outline" asChild>
                  <label htmlFor="boot-upload" className="cursor-pointer">
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </label>
                </Button>
              </div>
              <p className="text-xs text-stone-500">
                Recommended: Square image (PNG or JPG), transparent background works best
              </p>
            </div>

            {/* Uploaded URL */}
            {bootIconUrl && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Image className="w-4 h-4" />
                  Boot icon uploaded successfully!
                </div>
                <div>
                  <Label className="text-sm text-stone-700 mb-2 block">
                    Copy this URL and paste it in the code:
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={bootIconUrl} 
                      readOnly 
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(bootIconUrl);
                        toast.success('URL copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-stone-600 space-y-1">
                  <p className="font-medium">Next step:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open <code className="bg-stone-100 px-1 rounded">components/BootRating.jsx</code></li>
                    <li>Find line 4: <code className="bg-stone-100 px-1 rounded">const BOOT_ICON_URL = ...</code></li>
                    <li>Replace the URL with your uploaded image URL</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to change the boot icon:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload your custom boot icon image above</li>
                <li>Copy the generated URL</li>
                <li>Go to <code className="bg-blue-100 px-1 rounded">components/BootRating.jsx</code></li>
                <li>Replace <code className="bg-blue-100 px-1 rounded">BOOT_ICON_URL</code> value (line 4) with your URL</li>
                <li>Save and refresh to see your custom boot icon!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}