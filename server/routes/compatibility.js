import { Router } from "express";
import { get, all } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { assessBloodExchange } from "../utils/safetyAssessment.js";

const router = Router();

// Donor + recipient are looked up strictly by their unique donor_code /
// id, never by name, so two people who happen to share a name are never
// mixed up by the AI.
router.post("/check", requireAuth, async (req, res) => {
  const { donorId, recipientId } = req.body || {};
  if (!donorId || !recipientId) return res.status(400).json({ error: "donorId and recipientId are required." });

  const donor = await get("SELECT * FROM donor_profiles WHERE id = ?", [donorId]);
  const recipient = await get("SELECT * FROM donor_profiles WHERE id = ?", [recipientId]);
  if (!donor || !recipient) return res.status(404).json({ error: "Donor or recipient not found." });

  const donorReports = await all("SELECT * FROM blood_test_reports WHERE donor_profile_id = ?", [donor.id]);

  const assessment = assessBloodExchange({ donor, recipient, donorReports });
  res.json({ assessment });
});

export default router;
