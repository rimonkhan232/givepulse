import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeDonorReports } from "../utils/safetyAssessment.js";

const router = Router();

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    donorProfileId: row.donor_profile_id,
    testType: row.test_type,
    result: row.result,
    testDate: row.test_date,
    fileName: row.file_name,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// All of MY reports (any number -- this list can keep growing).
router.get("/", requireAuth, async (req, res) => {
  const rows = await all("SELECT * FROM blood_test_reports WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);
  res.json({ reports: rows.map(serialize) });
});

// Reports for any donor by their profile id (used by the compatibility
// checker and by admins/other users reviewing a specific donor).
router.get("/donor/:donorProfileId", requireAuth, async (req, res) => {
  const rows = await all(
    "SELECT * FROM blood_test_reports WHERE donor_profile_id = ? ORDER BY created_at DESC",
    [req.params.donorProfileId]
  );
  res.json({ reports: rows.map(serialize) });
});

// AI analysis of every saved report for the current user.
router.get("/me/analysis", requireAuth, async (req, res) => {
  const rows = await all("SELECT * FROM blood_test_reports WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);
  res.json(analyzeDonorReports(rows));
});

router.post("/", requireAuth, async (req, res) => {
  const b = req.body || {};
  const testType = b.testType || "N/A";
  const isSpecificTest = testType !== "N/A";

  // "No specific test" needs nothing further. Any specific test claim,
  // though, must come with a date, a result, and a proof file -- this is
  // what keeps dishonest donors from just typing in a fake clean result.
  if (isSpecificTest) {
    if (!b.testDate) return res.status(400).json({ error: "Test date is required for a specific test." });
    if (!b.fileName || !b.fileData) return res.status(400).json({ error: "A report file (image or PDF) is required for a specific test." });
    if (!b.result) return res.status(400).json({ error: "A result is required for a specific test." });
  }

  const profile = await get("SELECT id FROM donor_profiles WHERE user_id = ?", [req.userId]);
  const id = uid("rep");
  await run(
    `INSERT INTO blood_test_reports (id, user_id, donor_profile_id, test_type, result, test_date, file_name, file_data, file_mime, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.userId,
      profile?.id || null,
      testType,
      isSpecificTest ? b.result : "N/A",
      isSpecificTest ? b.testDate : null,
      isSpecificTest ? b.fileName : "",
      isSpecificTest ? b.fileData : null,
      isSpecificTest ? b.fileMime || "" : null,
      b.notes || "",
    ]
  );
  res.status(201).json({ report: serialize(await get("SELECT * FROM blood_test_reports WHERE id = ?", [id])) });
});

// Returns the actual proof file (base64) so it can be viewed as an image or
// embedded PDF -- kept out of the normal list responses so those stay small.
router.get("/:id/file", requireAuth, async (req, res) => {
  const row = await get("SELECT * FROM blood_test_reports WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Report not found." });
  if (row.user_id !== req.userId && req.userRole !== "admin") {
    return res.status(403).json({ error: "You don't have permission to view this file." });
  }
  if (!row.file_data) return res.status(404).json({ error: "No file attached to this report." });
  res.json({ fileName: row.file_name, fileMime: row.file_mime, fileData: row.file_data });
});

// Delete one of MY previously-added reports.
router.delete("/:id", requireAuth, async (req, res) => {
  const row = await get("SELECT * FROM blood_test_reports WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Report not found." });
  if (row.user_id !== req.userId && req.userRole !== "admin") {
    return res.status(403).json({ error: "You can only delete your own reports." });
  }
  await run("DELETE FROM blood_test_reports WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
