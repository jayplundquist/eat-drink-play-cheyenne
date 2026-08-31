import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, Copy, Check, Bot, MessageSquare, MousePointerClick, Plug, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Connect() {
  const [copied, setCopied] = useState(false);

  const serverUrl = useMemo(
    () => new URL('/api/mcp', window.location.origin).toString(),
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopied(true);
      toast.success('Server URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select and copy manually.');
    }
  };

  const clients = [
    {
      key: 'claude',
      label: 'Claude',
      icon: Bot,
      planNote: 'Connect via the Claude web app at claude.ai — custom connectors aren\'t available in the desktop app.',
      steps: [
        'On claude.ai, open your profile menu (top-right) and choose Settings.',
        'Go to the Connectors tab and click "Add custom connector".',
        'Give it a name (e.g. "Cheyenne Guide") and paste the server URL below.',
        'Click Add. Claude will open our sign-in page — approve access and you\'re connected.',
      ],
    },
    {
      key: 'chatgpt',
      label: 'ChatGPT',
      icon: MessageSquare,
      planNote: 'Requires a ChatGPT Pro plan — custom connectors (MCP) are not available on Plus.',
      steps: [
        'Open Apps and enable Developer mode (confirm the risk ChatGPT warns about).',
        'Click "Create app", name it, and paste the server URL below.',
        'Click Create, then enable the app from the chat composer before prompting it.',
        'ChatGPT will open our sign-in page — approve access and you\'re connected.',
      ],
    },
    {
      key: 'cursor',
      label: 'Cursor',
      icon: MousePointerClick,
      steps: [
        'Open Settings → Tools & Integrations and click "New MCP Server".',
        'This opens your mcp.json file — add an entry whose "url" is the server URL below.',
        'Save the file and toggle the new server on.',
        'Cursor will open our sign-in page — approve access and you\'re connected.',
      ],
    },
    {
      key: 'custom',
      label: 'Custom',
      icon: Plug,
      steps: [
        'Copy the server URL below.',
        'Add it as a streamable HTTP MCP server in your client.',
        'A name and the URL are all most clients need — then reload the client.',
        'Your client will open our sign-in page — approve access and you\'re connected.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 mb-3">
            <Sparkles className="w-7 h-7 text-amber-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Rye, serif' }}>
            Connect Your AI Assistant
          </h1>
          <p className="text-stone-600 max-w-xl mx-auto">
            Let Claude, ChatGPT, Cursor, or any MCP-compatible assistant explore Cheyenne with you —
            find venues, check garage sales, and manage your favorites, all by asking.
          </p>
        </div>

        {/* What it can do */}
        <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-bold text-amber-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
            What your assistant can do
          </h2>
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex gap-2"><Check className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />Search and browse local restaurants, bars, breweries, and activities.</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />Read and post reviews, and manage your saved favorites.</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />Find upcoming garage sales and add your own listings.</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />Track Big Boot visits and check trailheads on the Greenway.</li>
          </ul>
          <p className="text-xs text-stone-500 mt-3 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
            Your assistant only ever acts with your app permissions — sign in and approve access to connect.
          </p>
        </div>

        {/* Server URL */}
        <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-bold text-amber-900 mb-1" style={{ fontFamily: 'Rye, serif' }}>
            Your MCP server URL
          </h2>
          <p className="text-sm text-stone-600 mb-3">Copy this and paste it into your AI client.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={serverUrl}
              className="flex-1 px-3 py-2 rounded-md border border-amber-300 bg-amber-50 text-stone-800 text-sm font-mono select-all"
              onFocus={(e) => e.target.select()}
            />
            <Button
              onClick={handleCopy}
              className={`${copied ? 'bg-green-700 hover:bg-green-800' : 'bg-amber-700 hover:bg-amber-800'} text-white`}
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </div>
        </div>

        {/* Client instructions */}
        <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-amber-900 mb-4" style={{ fontFamily: 'Rye, serif' }}>
            Step-by-step setup
          </h2>
          <Tabs defaultValue="claude">
            <TabsList className="grid grid-cols-4 w-full mb-4 bg-amber-100">
              {clients.map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 data-[state=active]:bg-amber-700 data-[state=active]:text-amber-50 text-xs sm:text-sm">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {clients.map(({ key, label, planNote, steps }) => (
              <TabsContent key={key} value={key} className="mt-2">
                {planNote && (
                  <p className="mb-3 text-xs rounded-md bg-amber-100 border border-amber-300 px-3 py-2 text-amber-800 flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{planNote}</span>
                  </p>
                )}
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-700 text-amber-50 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-stone-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-5 pt-4 border-t border-amber-200 flex items-start gap-2 text-xs text-stone-500">
            <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
            <span>
              After we ship changes, refresh the connector in your client — assistants cache the tool list,
              so a refresh picks up new tools.
            </span>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/">
            <Button variant="outline" className="border-amber-700 text-amber-800 hover:bg-amber-100">
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}