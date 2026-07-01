import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let total = 0;
    let skip = 0;
    const limit = 100;

    while (true) {
      const batch = await base44.asServiceRole.entities.User.list(undefined, limit, skip);
      total += batch.length;
      if (batch.length < limit) break;
      skip += limit;
    }

    return Response.json({ count: total });
  } catch (error) {
    console.error('getUserCount error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});