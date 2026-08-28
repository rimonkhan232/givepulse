import { Router } from "express";
import { get, all, run } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { isValidNid } from "../data/validNids.js";

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    donorCode: row.donor_code,
    fullName: row.full_name,
    bloodGroup: row.blood_group,
    division: row.division,
    address: row.address,
    phone: row.phone,
    nid: row.nid,
    nidVerified: Boolean(row.nid_verified),
    hasNidPhoto: Boolean(row.nid_photo_data),
    wants: row.wants,
    lastDonationDate: row.last_donation_date,
    about: row.about,
    available: Boolean(row.available),
    rating: row.rating,
    totalDonations: row.total_donations,
    blacklisted: Boolean(row.blacklisted),
    createdAt: row.created_at,
  };
}

// List all donor profiles (paginated + filterable) for the directory,
// compatibility checker, messaging, etc. Public so the homepage stats and
// donor directory work before login too. Blacklisted donors (banned by an
// admin after a verified complaint) are hidden from this public directory.
router.get("/", async (req, res) => {
  const { bloodGroup, division, wants, q, limit = 500, offset = 0 } = req.query;
  let sql = "SELECT * FROM donor_profiles WHERE full_name != '' AND blacklisted = 0";
  const params = [];
  if (bloodGroup) { sql += " AND blood_group = ?"; params.push(bloodGroup); }
  if (division) { sql += " AND division = ?"; params.push(division); }
  if (wants) { sql += " AND (wants = ? OR wants = 'both')"; params.push(wants); }
  if (q) { sql += " AND (full_name ILIKE ? OR donor_code ILIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));
  const rows = await all(sql, params);
  const totalRow = await get("SELECT COUNT(*) AS c FROM donor_profiles WHERE full_name != '' AND blacklisted = 0");
  res.json({ donors: rows.map(serialize), total: totalRow.c });
});

router.get("/me", requireAuth, async (req, res) => {
  const row = await get("SELECT * FROM donor_profiles WHERE user_id = ?", [req.userId]);
  res.json({ donor: serialize(row) });
});

// Check a NID number against the demo "valid NID" dataset before the user
// even saves their profile, so the form can show valid/not-valid live.
// Public (no auth) so it can be checked as someone types, same as any
// other lightweight lookup.
router.get("/nid-check/:nid", async (req, res) => {
  res.json({ valid: isValidNid(req.params.nid) });
});

// The uploaded NID card photo is only ever returned to its own owner --
// never included in the public directory or another user's view.
router.get("/me/nid-photo", requireAuth, async (req, res) => {
  const row = await get("SELECT nid_photo_data, nid_photo_mime FROM donor_profiles WHERE user_id = ?", [req.userId]);
  if (!row?.nid_photo_data) return res.status(404).json({ error: "No NID photo uploaded." });
  res.json({ data: row.nid_photo_data, mime: row.nid_photo_mime });
});

router.put("/me", requireAuth, async (req, res) => {
  const existing = await get("SELECT * FROM donor_profiles WHERE user_id = ?", [req.userId]);
  if (!existing) return res.status(404).json({ error: "Profile not found." });
  const b = req.body || {};

  // If this NID was blacklisted on another account, block reuse so a banned
  // donor can't just sign up again under a new email with the same NID.
  if (b.nid && b.nid !== existing.nid) {
    const blacklistedMatch = await get(
      "SELECT id FROM donor_profiles WHERE nid = ? AND blacklisted = 1 AND id != ?",
      [b.nid, existing.id]
    );
    if (blacklistedMatch) {
      return res.status(403).json({ error: "This NID has been blacklisted and cannot be used on GivePulse." });
    }
  }

  const nid = b.nid ?? existing.nid;
  const nidVerified = isValidNid(nid) ? 1 : 0;

  await run(
    `UPDATE donor_profiles SET full_name=?, blood_group=?, division=?, address=?, phone=?, nid=?, nid_verified=?, nid_photo_data=?, nid_photo_mime=?, wants=?, last_donation_date=?, about=?, available=?
     WHERE user_id = ?`,
    [
      b.fullName ?? existing.full_name,
      b.bloodGroup ?? existing.blood_group,
      b.division ?? existing.division,
      b.address ?? existing.address,
      b.phone ?? existing.phone,
      nid,
      nidVerified,
      b.nidPhotoData ?? existing.nid_photo_data,
      b.nidPhotoMime ?? existing.nid_photo_mime,
      b.wants ?? existing.wants,
      b.lastDonationDate ?? existing.last_donation_date,
      b.about ?? existing.about,
      b.available === undefined ? existing.available : b.available ? 1 : 0,
      req.userId,
    ]
  );
  // Keep the user's display name in sync with their profile name.
  if (b.fullName) await run("UPDATE users SET full_name = ? WHERE id = ?", [b.fullName, req.userId]);
  const updated = await get("SELECT * FROM donor_profiles WHERE user_id = ?", [req.userId]);
  res.json({ donor: serialize(updated) });
});

router.get("/:id", async (req, res) => {
  const row = await get("SELECT * FROM donor_profiles WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Donor not found." });
  res.json({ donor: serialize(row) });
});

export default router;
