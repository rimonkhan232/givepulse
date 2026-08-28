import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
const RESERVATION_HOURS = 3;

function serialize(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    division: row.division,
    stock: JSON.parse(row.stock || "{}"),
    createdAt: row.created_at,
  };
}

export async function releaseExpiredReservations() {
  const now = new Date().toISOString();
  const expired = await all("SELECT * FROM reservations WHERE status = 'active' AND expires_at <= ?", [now]);
  for (const r of expired) {
    const bank = await get("SELECT * FROM blood_banks WHERE id = ?", [r.bank_id]);
    if (bank) {
      const stock = JSON.parse(bank.stock || "{}");
      stock[r.blood_group] = (stock[r.blood_group] || 0) + 1;
      await run("UPDATE blood_banks SET stock = ? WHERE id = ?", [JSON.stringify(stock), bank.id]);
    }
    await run("UPDATE reservations SET status = 'expired' WHERE id = ?", [r.id]);
  }
  return expired.length;
}

router.get("/", async (req, res) => {
  const { division, q, limit = 200, offset = 0 } = req.query;
  let sql = "SELECT * FROM blood_banks WHERE 1=1";
  const params = [];
  if (division) { sql += " AND division = ?"; params.push(division); }
  if (q) { sql += " AND name ILIKE ?"; params.push(`%${q}%`); }
  sql += " ORDER BY name ASC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));
  const rows = await all(sql, params);
  const totalRow = await get("SELECT COUNT(*) AS c FROM blood_banks");
  res.json({ bloodBanks: rows.map(serialize), total: totalRow.c });
});

router.get("/:id", async (req, res) => {
  const row = await get("SELECT * FROM blood_banks WHERE id = ?", [req.params.id]);
  if (!row) return res.status(404).json({ error: "Blood bank not found." });
  res.json({ bloodBank: serialize(row) });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const id = uid("bb");
  await run(
    "INSERT INTO blood_banks (id, name, address, phone, division, stock) VALUES (?, ?, ?, ?, ?, ?)",
    [id, b.name, b.address || "", b.phone || "", b.division || "", JSON.stringify(b.stock || {})]
  );
  res.status(201).json({ bloodBank: serialize(await get("SELECT * FROM blood_banks WHERE id = ?", [id])) });
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const existing = await get("SELECT * FROM blood_banks WHERE id = ?", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "Blood bank not found." });
  const b = req.body || {};
  await run("UPDATE blood_banks SET name=?, address=?, phone=?, division=?, stock=? WHERE id=?", [
    b.name ?? existing.name,
    b.address ?? existing.address,
    b.phone ?? existing.phone,
    b.division ?? existing.division,
    JSON.stringify(b.stock ?? JSON.parse(existing.stock || "{}")),
    req.params.id,
  ]);
  res.json({ bloodBank: serialize(await get("SELECT * FROM blood_banks WHERE id = ?", [req.params.id])) });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await run("DELETE FROM blood_banks WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

router.post("/:id/reserve", requireAuth, async (req, res) => {
  await releaseExpiredReservations();
  const { bloodGroup } = req.body || {};
  const bank = await get("SELECT * FROM blood_banks WHERE id = ?", [req.params.id]);
  if (!bank) return res.status(404).json({ error: "Blood bank not found." });
  const stock = JSON.parse(bank.stock || "{}");
  if (!stock[bloodGroup] || stock[bloodGroup] <= 0) {
    return res.status(400).json({ error: "No units available to reserve." });
  }
  stock[bloodGroup] -= 1;
  await run("UPDATE blood_banks SET stock = ? WHERE id = ?", [JSON.stringify(stock), bank.id]);

  const user = await get("SELECT * FROM users WHERE id = ?", [req.userId]);
  const id = uid("res");
  const now = Date.now();
  const reservedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + RESERVATION_HOURS * 60 * 60 * 1000).toISOString();
  await run(
    `INSERT INTO reservations (id, bank_id, bank_name, blood_group, user_id, user_name, status, reserved_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [id, bank.id, bank.name, bloodGroup, req.userId, user?.full_name, reservedAt, expiresAt]
  );

  res.status(201).json({ reservation: await get("SELECT * FROM reservations WHERE id = ?", [id]) });
});

router.get("/reservations/mine", requireAuth, async (req, res) => {
  await releaseExpiredReservations();
  const rows = await all("SELECT * FROM reservations WHERE user_id = ? ORDER BY reserved_at DESC", [req.userId]);
  res.json({ reservations: rows });
});

router.post("/reservations/:id/release", requireAuth, async (req, res) => {
  const reservation = await get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
  if (!reservation || reservation.status !== "active") return res.json({ ok: true });
  const bank = await get("SELECT * FROM blood_banks WHERE id = ?", [reservation.bank_id]);
  if (bank) {
    const stock = JSON.parse(bank.stock || "{}");
    stock[reservation.blood_group] = (stock[reservation.blood_group] || 0) + 1;
    await run("UPDATE blood_banks SET stock = ? WHERE id = ?", [JSON.stringify(stock), bank.id]);
  }
  await run("UPDATE reservations SET status = 'released' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
