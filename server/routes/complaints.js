import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

export const COMPLAINT_TYPES = [
  "Did not show up",
  "Asked for money unfairly",
  "Fake blood group or details",
  "Rude or abusive behavior",
  "Other",
];

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    complainantId: row.complainant_id,
    complainantName: row.complainant_name,
    donorId: row.donor_id,
    donorName: row.donor_name,
    donorCode: row.donor_code,
    donorNid: row.donor_nid,
    type: row.type,
    description: row.description,
    imageName: row.image_name,
    hasImage: Boolean(row.image_data),
    status: row.status,
    createdAt: row.created_at,
  };
}

// Any signed-in user can file a complaint against a donor they dealt with.
router.post("/", requireAuth, async (req, res) => {
  const { donorId, type, description, imageName, imageData, imageMime } = req.body || {};
  if (!donorId || !type) return res.status(400).json({ error: "donorId and type are required." });
  if (!imageName || !imageData) return res.status(400).json({ error: "Proof image is required." });

  const donor = await get("SELECT * FROM donor_profiles WHERE id = ?", [donorId]);
  if (!donor) return res.status(404).json({ error: "Donor not found." });

  const complainant = await get("SELECT * FROM users WHERE id = ?", [req.userId]);
  const id = uid("cmp");
  await run(
    `INSERT INTO complaints
      (id, complainant_id, complainant_name, donor_id, donor_name, donor_code, donor_nid, type, description, image_name, image_data, image_mime, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      id,
      req.userId,
      complainant?.full_name || "",
      donor.id,
      donor.full_name,
      donor.donor_code,
      donor.nid || "",
      type,
      description || "",
      imageName,
      imageData,
      imageMime || "",
    ]
  );
  res.status(201).json({ complaint: serialize(await get("SELECT * FROM complaints WHERE id = ?", [id])) });
});

// Only admins can see the complaint inbox -- complaints are not visible to
// the reported donor or to other users, only to platform moderators.
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM complaints WHERE 1=1";
  const params = [];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY created_at DESC";
  const rows = await all(sql, params);
  res.json({ complaints: rows.map(serialize) });
});

// Admin-only: fetch the actual proof image for a complaint.
router.get("/:id/image", requireAuth, requireAdmin, async (req, res) => {
  const row = await get("SELECT * FROM complaints WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Complaint not found." });
  if (!row.image_data) return res.status(404).json({ error: "No image attached to this complaint." });
  res.json({ imageName: row.image_name, imageMime: row.image_mime, imageData: row.image_data });
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const existing = await get("SELECT * FROM complaints WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Complaint not found." });
  const { status } = req.body || {};
  await run("UPDATE complaints SET status = ? WHERE id = ?", [status ?? existing.status, req.params.id]);
  res.json({ complaint: serialize(await get("SELECT * FROM complaints WHERE id = ?", [req.params.id])) });
});

// Blacklist the reported donor (by NID when available, so the same person
// can't dodge the ban by registering a second account) and mark the
// complaint reviewed in one step.
router.post("/:id/blacklist", requireAuth, requireAdmin, async (req, res) => {
  const complaint = await get("SELECT * FROM complaints WHERE id = ?", [req.params.id]);
  if (!complaint) return res.status(404).json({ error: "Complaint not found." });

  if (complaint.donor_nid) {
    await run("UPDATE donor_profiles SET blacklisted = 1 WHERE nid = ?", [complaint.donor_nid]);
  } else {
    await run("UPDATE donor_profiles SET blacklisted = 1 WHERE id = ?", [complaint.donor_id]);
  }
  await run("UPDATE complaints SET status = 'reviewed' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
