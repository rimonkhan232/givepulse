// Rough geographic centers of Bangladesh's 8 divisions -- used only to
// work out which division a browser-reported GPS coordinate is closest
// to for the "near me" popup. This is an approximation for convenience,
// not an official boundary/geocoding lookup.
export const DIVISION_CENTERS = {
  Dhaka: [23.8103, 90.4125],
  Chittagong: [22.3569, 91.7832],
  Sylhet: [24.8949, 91.8687],
  Khulna: [22.8456, 89.5403],
  Rajshahi: [24.3745, 88.6042],
  Barisal: [22.701, 90.3535],
  Rangpur: [25.7439, 89.2752],
  Mymensingh: [24.7471, 90.4203],
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Given a raw GPS coordinate, returns the closest of the 8 divisions and
// the rough distance to its center (km).
export function nearestDivision(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  for (const [name, center] of Object.entries(DIVISION_CENTERS)) {
    const d = haversineKm([lat, lon], center);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return { division: best, distanceKm: Math.round(bestDist) };
}

const STORAGE_KEY = "givepulse:geoDivision";

export function saveDetectedDivision(division) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ division, at: Date.now() }));
}

export function getDetectedDivision() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
