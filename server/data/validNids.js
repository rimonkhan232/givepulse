// A demo "valid NID" dataset -- NOT a real government NID lookup. This
// simulates having a database of 1000 registered National ID numbers: any
// NID a user types that matches one of these 1000 is treated as "valid",
// everything else is flagged as "not found". The list is generated with a
// fixed random seed so it's exactly the same 1000 numbers every time the
// server starts (no database table needed, nothing to re-seed).

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260829); // fixed seed -> reproducible list

function randomThirteenDigitNid() {
  // Bangladeshi-style 13-digit NID (same shape as the ones already
  // assigned to seeded demo donors in server/db/seed.js).
  const n = Math.floor(rand() * (9999999999999 - 1000000000000 + 1)) + 1000000000000;
  return String(n);
}

export const VALID_NIDS = new Set();
while (VALID_NIDS.size < 1000) {
  VALID_NIDS.add(randomThirteenDigitNid());
}

export function isValidNid(nid) {
  return VALID_NIDS.has(String(nid || "").trim());
}
