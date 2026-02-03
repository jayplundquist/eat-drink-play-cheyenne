import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const userAgent = req.headers.get('user-agent') || '';
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    await base44.asServiceRole.entities.SiteVisit.create({
      user_agent: userAgent,
      ip_address: clientIp.split(',')[0].trim()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error logging site visit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});