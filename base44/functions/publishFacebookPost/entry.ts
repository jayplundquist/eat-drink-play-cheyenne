import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { post_id } = body;
    if (!post_id) return Response.json({ error: 'post_id required' }, { status: 400 });

    const post = await base44.asServiceRole.entities.FacebookPost.get(post_id);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
    if (post.status === 'published') {
      return Response.json({ error: 'Already published' }, { status: 400 });
    }

    // 1. Get the Facebook connection token
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('facebook_pages');
    } catch (err) {
      console.error('Facebook connector error:', err.message);
      await base44.asServiceRole.entities.FacebookPost.update(post_id, {
        status: 'failed',
        error_message: 'Facebook not connected — reconnect the Facebook Pages connector.',
      });
      return Response.json({ error: 'Facebook connector not authorized. Reconnect Facebook.' }, { status: 500 });
    }

    const userToken = connection.accessToken;

    // 2. List managed pages and find the EDP Cheyenne page
    const accountsRes = await fetch(
      'https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token',
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const accountsData = await accountsRes.json();
    if (!accountsRes.ok || !accountsData.data) {
      const msg = accountsData.error?.message || 'Could not list Facebook pages.';
      await base44.asServiceRole.entities.FacebookPost.update(post_id, {
        status: 'failed',
        error_message: msg,
      });
      return Response.json({ error: msg }, { status: 500 });
    }

    const pages = accountsData.data;
    if (pages.length === 0) {
      await base44.asServiceRole.entities.FacebookPost.update(post_id, {
        status: 'failed',
        error_message: 'No Facebook pages found on the connected account.',
      });
      return Response.json({ error: 'No Facebook pages found' }, { status: 400 });
    }

    // Match by name, fall back to the first page
    const match = pages.find((p) => /edp|eat|drink|play|cheyenne/i.test(p.name)) || pages[0];
    const pageToken = match.access_token;
    const pageId = match.id;
    console.log(`Publishing to page: ${match.name} (${pageId})`);

    // 3. Publish — photos endpoint if image, feed endpoint if text-only
    let fbRes;
    if (post.image_url) {
      fbRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: post.image_url,
          message: post.post_text,
          access_token: pageToken,
        }),
      });
    } else {
      fbRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: post.post_text,
          access_token: pageToken,
        }),
      });
    }

    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      const isAuthError = fbData.error?.code === 190 || fbData.error?.code === 200;
      const errMsg = isAuthError
        ? 'Facebook token expired — reconnect the Facebook Pages connector.'
        : fbData.error?.message || 'Publish failed';
      await base44.asServiceRole.entities.FacebookPost.update(post_id, {
        status: 'failed',
        error_message: errMsg,
      });
      return Response.json({ error: errMsg }, { status: 500 });
    }

    // Photos endpoint returns {id, post_id}, feed returns {id}
    const fbPostId = fbData.post_id ? `${fbData.post_id}_${fbData.id}` : fbData.id;
    await base44.asServiceRole.entities.FacebookPost.update(post_id, {
      status: 'published',
      facebook_post_id: fbPostId || '',
      published_date: new Date().toISOString(),
      error_message: '',
    });

    return Response.json({ success: true, facebook_post_id: fbPostId, page: match.name });
  } catch (error) {
    console.error('publishFacebookPost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}