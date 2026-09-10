// Shared helpers for the weekly notification campaign system.
// Used by prepareFridayRecommendation, prepareWeeklyDigest, and sendApprovedCampaign.

export const SITE_URL = "https://eatdrinkplaycheyenne.base44.app";

// --- Unsubscribe link helpers ---
export function encodeEmail(email: string): string {
  return btoa(encodeURIComponent(email));
}

export function decodeEmail(encoded: string): string {
  return decodeURIComponent(atob(encoded));
}

export function unsubscribeLink(email: string): string {
  return `${SITE_URL}/unsubscribe?email=${encodeEmail(email)}`;
}

// --- Venue URL helper (mirrors src/lib/venueUrl.js for server-side use) ---
export function venueUrl(venue: any): string {
  if (!venue) return SITE_URL;
  const slug = venue.manual_slug || venue.slug;
  const category = venue.primary_category || (venue.categories && venue.categories[0]) || "venue";
  if (slug) return `${SITE_URL}/${category}/${slug}`;
  return `${SITE_URL}/VenueDetails?id=${venue.id}`;
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Western-themed email wrapper ---
// Wraps inner content with the site's amber/brown palette, Rye font headings,
// logo header, and an unsubscribe footer.
export function wrapEmailHtml(innerContent: string, recipientEmail: string): string {
  const unsub = unsubscribeLink(recipientEmail);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Eat, Drink, Play Cheyenne</title>
</head>
<body style="margin:0;padding:0;background-color:#fef3c7;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:4px solid #92400e;border-radius:8px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#78350f,#92400e);padding:28px 24px;text-align:center;">
              <div style="font-family:'Rye',Georgia,serif;font-size:26px;color:#fcd34d;letter-spacing:1px;">
                EAT, DRINK, PLAY CHEYENNE
              </div>
              <div style="color:#fef3c7;font-size:13px;margin-top:6px;font-style:italic;">
                Discover the best of the Magic City
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;color:#44403c;font-size:15px;line-height:1.6;">
              ${innerContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fef3c7;padding:20px 28px;border-top:3px solid #92400e;text-align:center;">
              <div style="font-family:'Rye',Georgia,serif;font-size:14px;color:#92400e;margin-bottom:8px;">
                Eat, Drink, Play Cheyenne
              </div>
              <div style="font-size:12px;color:#78716c;line-height:1.5;">
                You're receiving this because you're a member of Eat, Drink, Play Cheyenne.<br>
                <a href="${unsub}" style="color:#92400e;text-decoration:underline;font-weight:bold;">Unsubscribe from these emails</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:#92400e;text-decoration:underline;">Visit the site</a>
              </div>
              <div style="font-size:11px;color:#a8a29e;margin-top:10px;">
                © ${new Date().getFullYear()} Eat, Drink, Play Cheyenne · Made with ❤️ in Wyoming
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- Friday Recommendation content builder ---
export function buildFridayContent(venue: any) {
  const url = venueUrl(venue);
  const name = escapeHtml(venue.name);
  const desc = escapeHtml(venue.description || "A local gem worth discovering in Cheyenne.");
  const img = venue.image_url
    ? `<img src="${escapeHtml(venue.image_url)}" alt="${name}" style="width:100%;max-height:280px;object-fit:cover;border-radius:6px;margin-bottom:20px;border:2px solid #92400e;">`
    : "";
  const address = venue.address ? `<div style="color:#78716c;font-size:13px;margin-bottom:12px;">📍 ${escapeHtml(venue.address)}</div>` : "";

  const inner = `
    <h1 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:24px;margin:0 0 8px;text-align:center;">
      🤠 Try Something New This Friday!
    </h1>
    <p style="text-align:center;color:#78716c;font-style:italic;margin:0 0 24px;">
      Your weekly nudge to explore the Magic City
    </p>
    <div style="border:2px solid #d97706;border-radius:8px;overflow:hidden;background:#fffbeb;">
      ${img}
      <div style="padding:20px;">
        <h2 style="font-family:'Rye',Georgia,serif;color:#78350f;font-size:20px;margin:0 0 8px;">${name}</h2>
        ${address}
        <p style="margin:0 0 18px;">${desc}</p>
        <a href="${url}" style="display:inline-block;background:#92400e;color:#fef3c7;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;border:2px solid #78350f;">
          Check It Out →
        </a>
      </div>
    </div>
    <p style="text-align:center;margin-top:24px;color:#a8a29e;font-size:13px;">
      See more local spots on <a href="${SITE_URL}" style="color:#92400e;">Eat, Drink, Play Cheyenne</a>
    </p>
  `;

  return {
    emailSubject: `🤠 This Friday, try ${venue.name}!`,
    emailHtmlBuilder: (email: string) => wrapEmailHtml(inner, email),
    notificationTitle: `Try Something New: ${venue.name}`,
    notificationMessage: `This week's pick — ${venue.name}. Tap to explore!`,
  };
}

// --- Weekly Digest content builder ---
export function buildDigestContent(data: {
  newVenues: any[];
  garageSales: any[];
  topReviews: any[];
  bootShares: any[];
}) {
  const { newVenues, garageSales, topReviews, bootShares } = data;
  const sections: string[] = [];

  // New Venues
  if (newVenues.length > 0) {
    const items = newVenues.slice(0, 5).map((v) => {
      const img = v.image_url
        ? `<img src="${escapeHtml(v.image_url)}" alt="${escapeHtml(v.name)}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #d97706;">`
        : `<div style="width:80px;height:80px;background:#fef3c7;border-radius:6px;border:1px solid #d97706;display:flex;align-items:center;justify-content:center;font-size:28px;">🏠</div>`;
      return `
        <tr>
          <td style="padding:8px 12px 8px 0;vertical-align:top;">${img}</td>
          <td style="padding:8px 0;vertical-align:top;">
            <a href="${venueUrl(v)}" style="color:#92400e;font-weight:bold;text-decoration:none;font-size:16px;font-family:'Rye',Georgia,serif;">${escapeHtml(v.name)}</a>
            <div style="color:#78716c;font-size:13px;margin-top:4px;">${escapeHtml((v.description || "New on the site!").slice(0, 120))}${(v.description || "").length > 120 ? "…" : ""}</div>
          </td>
        </tr>`;
    }).join("");
    sections.push(`
      <h2 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:18px;border-bottom:2px solid #d97706;padding-bottom:6px;margin:0 0 12px;">🏠 New This Week (${newVenues.length})</h2>
      <table width="100%" cellpadding="0" cellspacing="0">${items}</table>
    `);
  }

  // Garage Sales
  if (garageSales.length > 0) {
    const items = garageSales.slice(0, 5).map((s) => `
      <div style="padding:8px 0;border-bottom:1px solid #fef3c7;">
        <a href="${SITE_URL}/GarageSales" style="color:#92400e;font-weight:bold;text-decoration:none;">${escapeHtml(s.title)}</a>
        <span style="color:#78716c;font-size:13px;"> — ${escapeHtml(s.address || "Cheyenne")}</span>
      </div>`).join("");
    sections.push(`
      <h2 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:18px;border-bottom:2px solid #d97706;padding-bottom:6px;margin:24px 0 12px;">🏷️ Upcoming Garage Sales (${garageSales.length})</h2>
      ${items}
    `);
  }

  // Top Reviews
  if (topReviews.length > 0) {
    const items = topReviews.slice(0, 3).map((r) => {
      const boots = "🥾".repeat(r.boots || 5);
      const comment = escapeHtml((r.comment || "").slice(0, 160));
      return `
        <div style="padding:10px 0;border-bottom:1px solid #fef3c7;">
          <div style="color:#d97706;font-size:14px;">${boots}</div>
          <div style="color:#44403c;font-size:14px;margin-top:4px;font-style:italic;">"${comment}${(r.comment || "").length > 160 ? "…" : ""}"</div>
          <div style="color:#a8a29e;font-size:12px;margin-top:4px;">— ${escapeHtml(r.user_email || "A local")}</div>
        </div>`;
    }).join("");
    sections.push(`
      <h2 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:18px;border-bottom:2px solid #d97706;padding-bottom:6px;margin:24px 0 12px;">⭐ Top Reviews This Week</h2>
      ${items}
    `);
  }

  // Boot Shares
  if (bootShares.length > 0) {
    const items = bootShares.slice(0, 4).map((b) => `
      <div style="display:inline-block;margin:6px;">
        <img src="${escapeHtml(b.photo_url)}" alt="${escapeHtml(b.boot_name)}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #d97706;">
        <div style="font-size:11px;color:#78716c;text-align:center;margin-top:4px;max-width:90px;">${escapeHtml(b.boot_name)}</div>
      </div>`).join("");
    sections.push(`
      <h2 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:18px;border-bottom:2px solid #d97706;padding-bottom:6px;margin:24px 0 12px;">🥾 Boot Sightings (${bootShares.length})</h2>
      <div style="text-align:center;">${items}</div>
    `);
  }

  // Empty week fallback
  if (sections.length === 0) {
    sections.push(`
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:48px;margin-bottom:12px;">🌵</div>
        <p style="color:#78716c;font-style:italic;font-size:16px;">A quiet week in Cheyenne — but there's always more to explore!</p>
        <a href="${SITE_URL}" style="display:inline-block;background:#92400e;color:#fef3c7;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;border:2px solid #78350f;">Explore Cheyenne →</a>
      </div>
    `);
  }

  const inner = `
    <h1 style="font-family:'Rye',Georgia,serif;color:#92400e;font-size:24px;margin:0 0 8px;text-align:center;">
      📬 New This Week in Cheyenne
    </h1>
    <p style="text-align:center;color:#78716c;font-style:italic;margin:0 0 24px;">
      Your weekly roundup of what's new on the site
    </p>
    ${sections.join("")}
    <p style="text-align:center;margin-top:28px;color:#a8a29e;font-size:13px;">
      See everything on <a href="${SITE_URL}" style="color:#92400e;">Eat, Drink, Play Cheyenne</a>
    </p>
  `;

  const totalCount = newVenues.length + garageSales.length + topReviews.length + bootShares.length;
  return {
    emailSubject: `📬 What's New in Cheyenne This Week`,
    emailHtmlBuilder: (email: string) => wrapEmailHtml(inner, email),
    notificationTitle: `New This Week in Cheyenne`,
    notificationMessage: totalCount > 0
      ? `${totalCount} new things to explore this week — ${newVenues.length} venues, ${garageSales.length} garage sales, and more!`
      : "A quiet week in Cheyenne — explore what's already on the site!",
  };
}