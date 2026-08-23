import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: row.donor_name,
    bloodGroup: row.blood_group,
    location: row.location,
    createdAt: row.created_at,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const { donorId, limit = 200, offset = 0 } = req.query;
  let sql = "SELECT * FROM donations WHERE 1=1";
  const params = [];
  if (donorId) { sql += " AND donor_id = ?"; params.push(donorId); }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));
  const rows = await all(sql, params);
  res.json({ donations: rows.map(serialize) });
});

router.post("/", requireAuth, async (req, res) => {
  const b = req.body || {};
  const id = uid("don");
  await run(
    "INSERT INTO donations (id, donor_id, donor_name, blood_group, location) VALUES (?, ?, ?, ?, ?)",
    [id, b.donorId, b.donorName, b.bloodGroup, b.location || ""]
  );
  if (b.donorId) {
    await run(
      "UPDATE donor_profiles SET total_donations = total_donations + 1, last_donation_date = to_char(now(), 'YYYY-MM-DD') WHERE id = ?",
      [b.donorId]
    );
  }
  res.status(201).json({ donation: serialize(await get("SELECT * FROM donations WHERE id = ?", [id])) });
});

export default router;
