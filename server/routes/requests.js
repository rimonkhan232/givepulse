import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    requesterDonorId: row.requester_donor_id || null,
    bloodGroup: row.blood_group,
    units: row.units,
    location: row.location,
    division: row.division,
    urgency: row.urgency,
    neededBy: row.needed_by,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get("/", async (req, res) => {
  const { status, bloodGroup, division, limit = 200, offset = 0 } = req.query;
  let sql = `
    SELECT br.*, dp.id AS requester_donor_id
    FROM blood_requests br
    LEFT JOIN donor_profiles dp ON dp.user_id = br.requester_id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += " AND br.status = ?"; params.push(status); }
  if (bloodGroup) { sql += " AND br.blood_group = ?"; params.push(bloodGroup); }
  if (division) { sql += " AND br.division = ?"; params.push(division); }
  sql += " ORDER BY br.created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));
  const rows = await all(sql, params);
  res.json({ requests: rows.map(serialize) });
});

router.post("/", requireAuth, async (req, res) => {
  const b = req.body || {};
  const user = await get("SELECT * FROM users WHERE id = ?", [req.userId]);
  // Auto-tag the request with the requester's own division so the "Near
  // me" tab can filter without asking the person to re-type it.
  const profile = await get("SELECT division FROM donor_profiles WHERE user_id = ?", [req.userId]);
  const id = uid("req");
  await run(
    `INSERT INTO blood_requests (id, requester_id, requester_name, blood_group, units, location, division, urgency, needed_by, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
    [id, req.userId, user?.full_name, b.bloodGroup, b.units || 1, b.location || "", profile?.division || "", b.urgency || "Normal", b.neededBy || "", b.notes || ""]
  );
  res.status(201).json({ request: serialize(await get("SELECT * FROM blood_requests WHERE id = ?", [id])) });
});

router.put("/:id", requireAuth, async (req, res) => {
  const row = await get("SELECT * FROM blood_requests WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Request not found." });
  if (row.requester_id !== req.userId && req.userRole !== "admin") {
    return res.status(403).json({ error: "You can only edit your own requests." });
  }
  const b = req.body || {};
  await run("UPDATE blood_requests SET status=? WHERE id=?", [b.status ?? row.status, req.params.id]);
  res.json({ request: serialize(await get("SELECT * FROM blood_requests WHERE id = ?", [req.params.id])) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const row = await get("SELECT * FROM blood_requests WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Request not found." });
  if (row.requester_id !== req.userId && req.userRole !== "admin") {
    return res.status(403).json({ error: "You can only delete your own requests." });
  }
  await run("DELETE FROM blood_requests WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
