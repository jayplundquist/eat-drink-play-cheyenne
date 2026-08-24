// Client-side garage-sale route optimization.
// Pure computation (no external API) — uses haversine distance with a road-network
// factor for drive-time estimates, and a time-window-aware greedy + 2-opt pass.

const EARTH_RADIUS_MI = 3958.8;
const AVG_CITY_SPEED_MPH = 30; // mixed city/residential driving
const VISIT_MINUTES = 15; // assumed time spent at each sale

function haversineMi([lat1, lon1], [lat2, lon2]) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function driveMinutes(mi) {
  return Math.max(1, (mi / AVG_CITY_SPEED_MPH) * 60);
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const ampm = h >= 24 ? 'AM' : h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function currentTimeMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function formatArrival(mins) {
  return minutesToTime(mins);
}

/**
 * Optimize a garage-sale route.
 * @param {Object} opts
 * @param {{lat:number,lng:number}} opts.start - starting point
 * @param {Array<{id:string,lat:number,lng:number,title:string,closeTime?:string}>} opts.stops
 * @param {boolean} [opts.returnToStart]
 * @param {number} [opts.startTimeMinutes] - route start time (minutes since midnight)
 * @returns {{order:Array, totalDistanceMi:number, totalTimeMin:number, travelTimeMin:number, warnings:string[]}}
 */
export function optimizeRoute({ start, stops, returnToStart = false, startTimeMinutes = null }) {
  const warnings = [];
  const startMin = startTimeMinutes != null ? startTimeMinutes : currentTimeMinutes();
  let cursor = startMin;
  let pos = [start.lat, start.lng];
  const remaining = stops.map((s) => ({ ...s }));
  const ordered = [];
  let totalMi = 0;
  let totalTravelMin = 0;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = Infinity;
    let bestTravel = 0;
    let bestArrival = 0;
    let bestLegMi = 0;

    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      const mi = haversineMi(pos, [s.lat, s.lng]);
      const travel = driveMinutes(mi);
      const arrival = cursor + travel;
      const close = timeToMinutes(s.closeTime);
      const late = close != null && arrival > close;
      // Late stops jump the queue (earliest closing first); otherwise nearest wins with a small close-time bias.
      const score = late
        ? -100000 + close - travel * 0.1
        : travel + (close != null ? close * 0.001 : 0);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        bestTravel = travel;
        bestArrival = arrival;
        bestLegMi = mi;
      }
    }

    const chosen = remaining[bestIdx];
    const close = timeToMinutes(chosen.closeTime);
    totalMi += bestTravel;
    totalTravelMin += bestTravel;
    if (close != null && bestArrival > close) {
      warnings.push(
        `This route may reach ${chosen.title} after its ${minutesToTime(close)} closing time.`
      );
    }
    ordered.push({ ...chosen, order: ordered.length + 1, arrival: bestArrival, close, legTravelMin: Math.round(bestTravel), legMi: Math.round(bestLegMi * 10) / 10 });
    cursor = bestArrival + VISIT_MINUTES;
    pos = [chosen.lat, chosen.lng];
    remaining.splice(bestIdx, 1);
  }

  if (returnToStart) {
    const mi = haversineMi(pos, [start.lat, start.lng]);
    totalMi += mi;
    totalTravelMin += driveMinutes(mi);
    cursor += driveMinutes(mi);
  }

  // Light 2-opt pass: try reversing segments to cut distance, but only accept
  // swaps that don't introduce new late arrivals.
  let improved = true;
  let guard = 0;
  while (improved && guard < 40) {
    improved = false;
    guard++;
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        const candidate = twoOptSwap(ordered, i, k);
        if (routeDistance(start, candidate, returnToStart) < routeDistance(start, ordered, returnToStart)) {
          if (!introducesNewLate(candidate, startMin)) {
            candidate.forEach((s, idx) => (s.order = idx + 1));
            ordered.splice(0, ordered.length, ...candidate);
            improved = true;
          }
        }
      }
    }
  }

  return {
    order: ordered,
    totalDistanceMi: Math.round(totalMi * 10) / 10,
    totalTimeMin: Math.round(cursor - startMin),
    travelTimeMin: Math.round(totalTravelMin),
    warnings,
  };
}

function twoOptSwap(route, i, k) {
  const copy = route.map((s) => ({ ...s }));
  const reversed = copy.slice(i, k + 1).reverse();
  return [...copy.slice(0, i), ...reversed, ...copy.slice(k + 1)];
}

function routeDistance(start, route, returnToStart) {
  let dist = haversineMi([start.lat, start.lng], [route[0].lat, route[0].lng]);
  for (let i = 0; i < route.length - 1; i++) {
    dist += haversineMi([route[i].lat, route[i].lng], [route[i + 1].lat, route[i + 1].lng]);
  }
  if (returnToStart) dist += haversineMi([route[route.length - 1].lat, route[route.length - 1].lng], [start.lat, start.lng]);
  return dist;
}

function introducesNewLate(route, startMin) {
  let t = startMin;
  let pos = null;
  for (const s of route) {
    if (pos) t += driveMinutes(haversineMi(pos, [s.lat, s.lng]));
    const close = timeToMinutes(s.closeTime);
    if (close != null && t > close) return true;
    t += VISIT_MINUTES;
    pos = [s.lat, s.lng];
  }
  return false;
}