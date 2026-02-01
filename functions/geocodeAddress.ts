import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Mock coordinates for common Cheyenne locations
const LOCATION_COORDS = {
  'cheyenne': [41.1400, -104.8202],
};

// Generate consistent coordinates for addresses using a simple hash
const getCoordinatesForAddress = (address) => {
  if (!address) return [41.1400, -104.8202];
  
  // Simple hash function to generate consistent but varied coordinates
  const hash = address.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  const lat = 41.1400 + ((hash % 100) / 1000);
  const lng = -104.8202 + ((Math.floor(hash / 100) % 100) / 1000);
  
  return [lat, lng];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { address } = payload;

    if (!address) {
      return Response.json({ coordinates: [41.1400, -104.8202] });
    }

    // For now, use mock coordinates based on address
    // In production, integrate with a real geocoding API like OpenStreetMap, Google Maps, etc.
    const coordinates = getCoordinatesForAddress(address);

    return Response.json({ coordinates });
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ 
      error: error.message,
      coordinates: [41.1400, -104.8202]
    }, { status: 500 });
  }
});