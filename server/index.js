import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { get, initDb } from "./db/connection.js";
import { setupSocket } from "./socket.js";
import { releaseExpiredReservations } from "./routes/bloodBanks.js";

import authRoutes from "./routes/auth.js";
import donorRoutes from "./routes/donors.js";
import bloodBankRoutes from "./routes/bloodBanks.js";
import requestRoutes from "./routes/requests.js";
import donationRoutes from "./routes/donations.js";
import reportRoutes from "./routes/reports.js";
import compatibilityRoutes from "./routes/compatibility.js";
import messageRoutes from "./routes/messages.js";
import adminRoutes from "./routes/admin.js";
import complaintRoutes from "./routes/complaints.js";

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Runs a real (tiny) query, not just a network ping -- this is what counts
// as "activity" for Supabase's free-tier inactivity timer, so a scheduled
// hit to this endpoint (see .github/workflows/keep-alive.yml) keeps the
// database from auto-pausing after 7 days of silence.
app.get("/api/health", async (req, res) => {
  try {
    await get("SELECT 1");
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/blood-banks", bloodBankRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/compatibility", compatibilityRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaints", complaintRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const server = http.createServer(app);
const io = setupSocket(server, CORS_ORIGIN);
app.set("io", io);

// The schema must exist before anything else touches the database --
// especially important against a fresh Turso database on first deploy.
await initDb();

await releaseExpiredReservations();
setInterval(() => releaseExpiredReservations().catch(console.error), 60 * 1000);

server.listen(PORT, () => {
  console.log(`GivePulse API listening on http://localhost:${PORT}`);
});
