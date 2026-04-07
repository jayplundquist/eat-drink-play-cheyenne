import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can geocode boots
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all boots
    const boots = await base44.asServiceRole.entities.Boot.list();
    
    let updated = 0;

    // Geocode each boot using Nominatim (OpenStreetMap)
    for (const boot of boots) {
      try {
        const query = `${boot.address}, Cheyenne, Wyoming, USA`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          { headers: { 'User-Agent': 'BootApp' } }
        );
        
        const results = await response.json();
        
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          
          await base44.asServiceRole.entities.Boot.update(boot.id, {
            lat,
            lng
          });
          updated++;
          console.log(`Geocoded ${boot.name}: ${lat}, ${lng}`);
        } else {
          console.error(`No geocoding result for ${boot.name}: ${boot.address}`);
        }
      } catch (err) {
        console.error(`Geocoding error for ${boot.name}:`, err.message);
      }
    }

    return Response.json({ 
      message: `Geocoded ${updated} boots`,
      updated,
      total: boots.length
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});