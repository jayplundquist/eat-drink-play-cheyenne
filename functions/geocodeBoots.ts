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
    
    // Filter boots that need geocoding (missing lat/lng)
    const bootsToGeocode = boots.filter(boot => !boot.lat || !boot.lng);
    
    if (bootsToGeocode.length === 0) {
      return Response.json({ message: 'All boots already geocoded', updated: 0 });
    }

    let updated = 0;

    // Geocode each boot
    for (const boot of bootsToGeocode) {
      const prompt = `Get the exact latitude and longitude coordinates for: "${boot.address}, Cheyenne, Wyoming, USA". Return ONLY a JSON object with "lat" and "lng" fields. Example: {"lat": 41.1400, "lng": -104.8202}`;
      
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          required: ['lat', 'lng']
        }
      });

      if (result.lat && result.lng) {
        await base44.asServiceRole.entities.Boot.update(boot.id, {
          lat: result.lat,
          lng: result.lng
        });
        updated++;
        console.log(`Geocoded ${boot.name}: ${result.lat}, ${result.lng}`);
      } else {
        console.error(`Failed to geocode ${boot.name}`);
      }
    }

    return Response.json({ 
      message: `Geocoded ${updated} boots`,
      updated,
      total: bootsToGeocode.length
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});