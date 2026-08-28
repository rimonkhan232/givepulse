import { Router } from "express";
import bcrypt from "bcryptjs";
import { get, run, uid, nextDonorCode } from "../db/connection.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

function toPublicUser(row) {
  if (!row) return null;
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role, phone: row.phone, createdAt: row.created_at };
}

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Full name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const existing = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [email.trim()]);
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const id = uid("user");
  const passwordHash = bcrypt.hashSync(password, 10);
  await run(
    "INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
    [id, fullName.trim(), email.trim().toLowerCase(), passwordHash]
  );

  // Every new account gets an empty donor profile with a unique donor code
  // right away -- this is what the AI and other users key off, never the name.
  const profileId = uid("dp");
  const donorCode = await nextDonorCode();
  await run(
    `INSERT INTO donor_profiles
      (id, user_id, donor_code, full_name, blood_group, division, address, phone, wants, available, rating, total_donations)
     VALUES (?, ?, ?, ?, '', '', '', '', 'both', 1, 0, 0)`,
    [profileId, id, donorCode, fullName.trim()]
  );

  const user = await get("SELECT * FROM users WHERE id = ?", [id]);
  const token = signToken(user);
  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const user = await get("SELECT * FROM users WHERE lower(email) = lower(?)", [email.trim()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await get("SELECT * FROM users WHERE id = ?", [req.userId]);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: toPublicUser(user) });
});

// Simple, self-service reset (no email provider configured) -- verifies the
// account exists then lets the caller set a new password immediately.
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  const user = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [(email || "").trim()]);
  if (!user) return res.status(404).json({ error: "No account found with that email." });
  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const user = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [(email || "").trim()]);
  if (!user) return res.status(404).json({ error: "No account found with that email." });
  await run("UPDATE users SET password_hash = ? WHERE id = ?", [bcrypt.hashSync(newPassword, 10), user.id]);
  res.json({ ok: true });
});

export default router;
