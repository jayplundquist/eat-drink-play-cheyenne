import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { decodeEmail } from '../../shared/campaignEmails.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = await req.json(); } catch {}
    const { email } = body as any;
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Decode the base64-encoded email from the unsubscribe link
    let decodedEmail: string;
    try {
      decodedEmail = decodeEmail(email).toLowerCase().trim();
    } catch {
      decodedEmail = String(email).toLowerCase().trim();
    }

    console.log(`Unsubscribe request for ${decodedEmail}`);

    // Find the user by email and opt them out
    const users = await base44.asServiceRole.entities.User.filter({});
    const target = users.find((u) => u.email && u.email.toLowerCase() === decodedEmail);

    if (target) {
      await base44.asServiceRole.entities.User.update(target.id, {
        email_opt_out: true,
      });
      console.log(`Opted out: ${decodedEmail}`);
      return Response.json({ success: true, email: decodedEmail });
    }

    // Email not found — still return success so the page confirms (privacy)
    console.log(`Email not found, returning success anyway: ${decodedEmail}`);
    return Response.json({ success: true, email: decodedEmail, not_found: true });
  } catch (error) {
    console.error('unsubscribeUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}