import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL is not set. Add your Supabase connection string to server/.env " +
      "(see server/.env.example) -- this app needs a real Postgres database to run."
  );
}

// Supabase (and most hosted Postgres) require SSL, but with a
// self-signed-looking chain from Node's perspective -- this is the
// standard, safe way to allow that without disabling TLS entirely.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

// The rest of this codebase was written using SQLite-style "?" positional
// placeholders. Rather than rewrite every query in every route file,
// translate them to Postgres's "$1, $2, ..." style right here, in one
// place, so every route file works completely unchanged.
function toPgQuery(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function get(sql, params = []) {
  const { rows } = await pool.query(toPgQuery(sql), params);
  return rows[0] ?? null;
}
export async function all(sql, params = []) {
  const { rows } = await pool.query(toPgQuery(sql), params);
  return rows;
}
export async function run(sql, params = []) {
  const res = await pool.query(toPgQuery(sql), params);
  return { rowCount: res.rowCount };
}
// Runs several statements as one atomic transaction -- used by the seed script.
export async function batch(statements) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const s of statements) {
      await client.query(toPgQuery(s.sql), s.args || []);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Back-compat namespace for any file that prefers `db.get(...)` style.
export const db = { get, all, run, batch };

export async function initDb() {
  // No params here on purpose -- node-postgres only allows multiple
  // semicolon-separated statements in one call when there are no
  // placeholders (the "simple query" protocol), which is exactly what we
  // want for a one-shot schema creation.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

    CREATE TABLE IF NOT EXISTS donor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      donor_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      division TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      nid TEXT,
      wants TEXT DEFAULT 'both',
      last_donation_date TEXT,
      about TEXT,
      available INTEGER DEFAULT 1,
      blacklisted INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      total_donations INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    CREATE INDEX IF NOT EXISTS idx_donor_profiles_group ON donor_profiles(blood_group);
    CREATE INDEX IF NOT EXISTS idx_donor_profiles_division ON donor_profiles(division);

    CREATE TABLE IF NOT EXISTS blood_banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      division TEXT,
      stock TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    CREATE INDEX IF NOT EXISTS idx_blood_banks_division ON blood_banks(division);

    CREATE TABLE IF NOT EXISTS blood_requests (
      id TEXT PRIMARY KEY,
      requester_id TEXT,
      requester_name TEXT,
      blood_group TEXT,
      units INTEGER DEFAULT 1,
      location TEXT,
      division TEXT,
      urgency TEXT DEFAULT 'Normal',
      needed_by TEXT,
      notes TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      donor_id TEXT,
      donor_name TEXT,
      blood_group TEXT,
      location TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

    CREATE TABLE IF NOT EXISTS blood_test_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      donor_profile_id TEXT,
      test_type TEXT,
      result TEXT,
      test_date TEXT,
      file_name TEXT,
      file_data TEXT,
      file_mime TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    CREATE INDEX IF NOT EXISTS idx_reports_donor_profile ON blood_test_reports(donor_profile_id);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON blood_test_reports(user_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at);

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewer_id TEXT,
      reviewer_name TEXT,
      target_donor_id TEXT,
      rating INTEGER,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      bank_id TEXT,
      bank_name TEXT,
      blood_group TEXT,
      user_id TEXT,
      user_name TEXT,
      status TEXT DEFAULT 'active',
      reserved_at TEXT,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complainant_id TEXT,
      complainant_name TEXT,
      donor_id TEXT,
      donor_name TEXT,
      donor_code TEXT,
      donor_nid TEXT,
      type TEXT,
      description TEXT,
      image_name TEXT,
      image_data TEXT,
      image_mime TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );
    CREATE INDEX IF NOT EXISTS idx_complaints_donor ON complaints(donor_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );

    ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS nid TEXT;
    ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS blacklisted INTEGER DEFAULT 0;
    ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS division TEXT;
    ALTER TABLE blood_test_reports ADD COLUMN IF NOT EXISTS file_data TEXT;
    ALTER TABLE blood_test_reports ADD COLUMN IF NOT EXISTS file_mime TEXT;
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_data TEXT;
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_mime TEXT;
  `);
}

export async function nextDonorCode() {
  const row = await get("SELECT value FROM counters WHERE name = 'donor_code'");
  const next = (row?.value || 0) + 1;
  if (row) {
    await run("UPDATE counters SET value = ? WHERE name = 'donor_code'", [next]);
  } else {
    await run("INSERT INTO counters (name, value) VALUES ('donor_code', ?)", [next]);
  }
  return `GP-${String(next).padStart(6, "0")}`;
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
