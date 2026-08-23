import { Router } from "express";
import { get, all, run } from "../db/connection.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/stats", async (req, res) => {
  const donors = (await get("SELECT COUNT(*) c FROM donor_profiles WHERE full_name != ''")).c;
  const banks = (await get("SELECT COUNT(*) c FROM blood_banks")).c;
  const requests = (await get("SELECT COUNT(*) c FROM blood_requests")).c;
  const openRequests = (await get("SELECT COUNT(*) c FROM blood_requests WHERE status='open'")).c;
  const donations = (await get("SELECT COUNT(*) c FROM donations")).c;
  const users = (await get("SELECT COUNT(*) c FROM users")).c;
  const reports = (await get("SELECT COUNT(*) c FROM blood_test_reports")).c;
  const byGroup = await all(
    "SELECT blood_group, COUNT(*) c FROM donor_profiles WHERE full_name != '' GROUP BY blood_group"
  );
  const byDivision = await all(
    "SELECT division, COUNT(*) c FROM donor_profiles WHERE full_name != '' GROUP BY division"
  );
  res.json({
    donors, banks, requests, openRequests, donations, users, reports,
    byGroup: Object.fromEntries(byGroup.map((r) => [r.blood_group, r.c])),
    byDivision: Object.fromEntries(byDivision.map((r) => [r.division, r.c])),
  });
});

router.get("/reports", async (req, res) => {
  const rows = await all("SELECT test_type, result, test_date FROM blood_test_reports");
  res.json({ reports: rows.map((r) => ({ testType: r.test_type, result: r.result, testDate: r.test_date })) });
});

// Which donor_profile ids have at least one report on file -- used by the
// admin donor list to show a report-status badge without a heavy join.
router.get("/donors-with-reports", async (req, res) => {
  const rows = await all("SELECT DISTINCT donor_profile_id FROM blood_test_reports WHERE donor_profile_id IS NOT NULL");
  res.json({ donorProfileIds: rows.map((r) => r.donor_profile_id) });
});

// Unlike the public /api/donors list, this includes blacklisted donors too
// -- admins need to see and manage them, not just the "clean" directory.
router.get("/donors", async (req, res) => {
  const { q, limit = 500, offset = 0 } = req.query;
  let sql = "SELECT * FROM donor_profiles WHERE full_name != ''";
  const params = [];
  if (q) { sql += " AND (full_name ILIKE ? OR donor_code ILIKE ? OR nid ILIKE ?)"; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));
  const rows = await all(sql, params);
  res.json({
    donors: rows.map((row) => ({
      id: row.id,
      donorCode: row.donor_code,
      fullName: row.full_name,
      bloodGroup: row.blood_group,
      division: row.division,
      nid: row.nid,
      available: Boolean(row.available),
      blacklisted: Boolean(row.blacklisted),
    })),
  });
});

router.get("/users", async (req, res) => {
  const rows = await all(
    `SELECT u.id, u.full_name, u.email, u.role, u.created_at, d.donor_code, d.blood_group, d.division
     FROM users u LEFT JOIN donor_profiles d ON d.user_id = u.id ORDER BY u.created_at DESC`
  );
  res.json({ users: rows.map((r) => ({
    id: r.id, fullName: r.full_name, email: r.email, role: r.role, createdAt: r.created_at,
    donorCode: r.donor_code, bloodGroup: r.blood_group, division: r.division,
  })) });
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ error: "You cannot delete your own account." });
  await run("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

router.put("/donors/:id", async (req, res) => {
  const existing = await get("SELECT * FROM donor_profiles WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Donor not found." });
  const b = req.body || {};
  await run(
    `UPDATE donor_profiles SET full_name=?, blood_group=?, division=?, address=?, phone=?, nid=?, available=? WHERE id=?`,
    [
      b.fullName ?? existing.full_name,
      b.bloodGroup ?? existing.blood_group,
      b.division ?? existing.division,
      b.address ?? existing.address,
      b.phone ?? existing.phone,
      b.nid ?? existing.nid,
      b.available === undefined ? existing.available : b.available ? 1 : 0,
      req.params.id,
    ]
  );
  res.json({ ok: true });
});

router.put("/donors/:id/blacklist", async (req, res) => {
  const existing = await get("SELECT * FROM donor_profiles WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Donor not found." });
  const { blacklisted } = req.body || {};
  const value = blacklisted === undefined ? 1 : blacklisted ? 1 : 0;
  if (existing.nid) {
    await run("UPDATE donor_profiles SET blacklisted = ? WHERE nid = ?", [value, existing.nid]);
  } else {
    await run("UPDATE donor_profiles SET blacklisted = ? WHERE id = ?", [value, req.params.id]);
  }
  res.json({ ok: true });
});

// Deletes the donor's full account (user row + profile via cascade), not
// just the profile -- this is the "delete the account" action from a
// verified complaint.
router.delete("/donors/:id/account", async (req, res) => {
  const donor = await get("SELECT * FROM donor_profiles WHERE id = ?", [req.params.id]);
  if (!donor) return res.status(404).json({ error: "Donor not found." });
  if (donor.user_id) {
    await run("DELETE FROM users WHERE id = ?", [donor.user_id]);
  } else {
    await run("DELETE FROM donor_profiles WHERE id = ?", [req.params.id]);
  }
  res.json({ ok: true });
});

router.delete("/donors/:id", async (req, res) => {
  await run("DELETE FROM donor_profiles WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
