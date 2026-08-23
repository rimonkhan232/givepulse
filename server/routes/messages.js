import { Router } from "express";
import { get, all, run, uid } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

export async function getMessageContacts(currentUserId) {
  const donors = await all("SELECT * FROM donor_profiles WHERE user_id != ? AND full_name != ''", [currentUserId]);
  const contacts = donors.map((d) => ({
    id: d.id,
    name: d.full_name,
    donorCode: d.donor_code,
    subtitle: `${d.blood_group || "?"} · ${d.division || "?"} · ${d.donor_code}`,
  }));

  const knownIds = new Set(contacts.map((c) => c.id));
  const knownUserIds = new Set(donors.map((d) => d.user_id).filter(Boolean));

  const requests = await all("SELECT * FROM blood_requests WHERE requester_id != ?", [currentUserId]);
  requests.forEach((r) => {
    if (knownUserIds.has(r.requester_id)) return;
    if (knownIds.has(r.requester_id)) return;
    knownIds.add(r.requester_id);
    contacts.push({ id: r.requester_id, name: r.requester_name, subtitle: "Posted a blood request" });
  });

  return contacts;
}

router.get("/contacts", requireAuth, async (req, res) => {
  res.json({ contacts: await getMessageContacts(req.userId) });
});

// Thread id is derived from the two participants' stable ids, sorted, so
// both sides always land on the same thread regardless of who opened it.
function threadIdFor(a, b) {
  return [a, b].sort().join("__");
}

router.get("/thread/:otherId", requireAuth, async (req, res) => {
  const threadId = threadIdFor(req.userId, req.params.otherId);
  const rows = await all("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT 500", [threadId]);
  res.json({
    threadId,
    messages: rows.map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      body: m.body,
      createdAt: m.created_at,
    })),
  });
});

router.post("/thread/:otherId", requireAuth, async (req, res) => {
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: "Message body is required." });
  const threadId = threadIdFor(req.userId, req.params.otherId);
  const user = await get("SELECT * FROM users WHERE id = ?", [req.userId]);
  const id = uid("msg");
  await run(
    "INSERT INTO messages (id, thread_id, sender_id, sender_name, body) VALUES (?, ?, ?, ?, ?)",
    [id, threadId, req.userId, user?.full_name, body.trim()]
  );
  const created = await get("SELECT * FROM messages WHERE id = ?", [id]);
  const message = {
    id: created.id,
    threadId: created.thread_id,
    senderId: created.sender_id,
    senderName: created.sender_name,
    body: created.body,
    createdAt: created.created_at,
  };
  // Push to both participants over the socket instantly (see server/socket.js)
  req.app.get("io")?.to(`user:${req.userId}`).to(`user:${req.params.otherId}`).emit("message:new", message);
  res.status(201).json({ message });
});

export { threadIdFor };
export default router;
