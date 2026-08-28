import bcrypt from "bcryptjs";
import { get, batch, uid, initDb } from "./connection.js";

const DIVISIONS = {
  Dhaka: ["Dhanmondi", "Mirpur", "Khilkhet", "Uttara", "Mohammadpur", "Badda", "Gulshan", "Jatrabari"],
  Chittagong: ["Agrabad", "Panchlaish", "Halishahar", "Nasirabad", "Pahartali", "Kotwali"],
  Sylhet: ["Zindabazar", "Ambarkhana", "Shibganj", "Subid Bazar", "Tilagor"],
  Khulna: ["KDA Avenue", "Sonadanga", "Khalishpur", "Daulatpur"],
  Rajshahi: ["Boalia", "Motihar", "Rajpara", "Shaheb Bazar"],
  Barisal: ["Band Road", "Nathullabad", "Kawnia"],
  Rangpur: ["Jahaj Company More", "Modern More", "Dhap"],
  Mymensingh: ["Ganginarpar", "Chorpara", "Kachijhuli"],
};
const DIVISION_NAMES = Object.keys(DIVISIONS);

const MALE_FIRST = [
  "Rakib", "Tanvir", "Shakil", "Kabir", "Mahmud", "Arif", "Fahim", "Rafiq", "Sabbir", "Nayeem",
  "Imran", "Rifat", "Shanto", "Jubayer", "Rakibul", "Sohel", "Asif", "Habibur", "Anisur", "Zahid",
  "Emran", "Rezaul", "Delwar", "Nasir", "Faruk", "Mizanur", "Shahriar", "Rashed", "Sajid", "Toha",
  "Rubel", "Sumon", "Sazzad", "Mahfuz", "Nazmul", "Anik", "Riyad", "Shahin", "Kamrul", "Iftekhar",
];
const FEMALE_FIRST = [
  "Farah", "Nusrat", "Sumaiya", "Tasnim", "Jannatul", "Marium", "Sharmin", "Nazia", "Ayesha", "Tania",
  "Rabeya", "Shirin", "Mahmuda", "Farzana", "Rima", "Shathi", "Lamia", "Sadia", "Nowshin", "Ruma",
  "Afsana", "Kanta", "Popy", "Tahmina", "Jesmin", "Moushumi", "Rupa", "Shopna", "Nasrin", "Momo",
];
const LAST_NAMES = [
  "Rahman", "Khan", "Ahmed", "Hossain", "Islam", "Chowdhury", "Akter", "Alam", "Uddin", "Karim",
  "Molla", "Sarkar", "Talukder", "Mia", "Bhuiyan", "Sheikh", "Miah", "Haque", "Siddique", "Kabir",
];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

// Roughly reflects real-world ABO/Rh distribution in South Asia.
const BLOOD_GROUP_WEIGHTS = [
  ["A+", 22], ["B+", 30], ["O+", 30], ["AB+", 7],
  ["A-", 3], ["B-", 3], ["O-", 4], ["AB-", 1],
];
function weightedBloodGroup() {
  const total = BLOOD_GROUP_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [g, w] of BLOOD_GROUP_WEIGHTS) {
    if (r < w) return g;
    r -= w;
  }
  return "O+";
}

function randomPhone() {
  const prefixes = ["013", "014", "015", "016", "017", "018", "019"];
  return `${pick(prefixes)}${randInt(10000000, 99999999)}`;
}

// Fake but well-formed 13-digit Bangladeshi-style NID, unique per donor so
// the blacklist-by-NID logic has something real to key off in the demo data.
function randomNid() {
  return String(randInt(1000000000000, 9999999999999));
}

function randomDate(daysBack) {
  const d = new Date(Date.now() - randInt(0, daysBack) * 86400000);
  return d.toISOString().slice(0, 10);
}

const ABOUT_TEMPLATES = [
  "Happy to help nearby hospitals on short notice.",
  "Regular donor, donates every few months.",
  "First-time volunteer, eager to help the community.",
  "Works close to the city medical college, easy to reach.",
  "Available on weekends for emergency donations.",
  "Prefers to be contacted a day in advance.",
  "Active blood donation club member.",
  "Donated multiple times, no complications.",
  "",
  "",
];

const TEST_TYPES = ["HIV", "Hepatitis B", "Hepatitis C", "VDRL (Syphilis)", "Malaria", "Anemia", "Sickle Cell Disease"];

// Executes a big list of {sql, args} statements in manageable chunks --
// batching them (instead of one round trip per row) is what keeps this fast
// even against a networked database like Turso, not just a local file.
async function runInChunks(statements, chunkSize = 200) {
  for (let i = 0; i < statements.length; i += chunkSize) {
    await batch(statements.slice(i, i + chunkSize));
  }
}

async function run() {
  await initDb();

  // ---- Wipe demo / previous seed data completely ----
  await runInChunks([
    { sql: "DELETE FROM messages" },
    { sql: "DELETE FROM reviews" },
    { sql: "DELETE FROM reservations" },
    { sql: "DELETE FROM blood_test_reports" },
    { sql: "DELETE FROM donations" },
    { sql: "DELETE FROM blood_requests" },
    { sql: "DELETE FROM complaints" },
    { sql: "DELETE FROM donor_profiles" },
    { sql: "DELETE FROM blood_banks" },
    { sql: "DELETE FROM users" },
    { sql: "DELETE FROM counters" },
  ]);

  const statements = [];

  // ---- Admin account (replaces the old demo admin) ----
  const adminId = uid("user");
  statements.push({
    sql: "INSERT INTO users (id, full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)",
    args: [adminId, "Rimon Khan", "rimonkhan0403@gmail.com", bcrypt.hashSync("232002091", 10), "admin", null],
  });

  // ---- 1000 donor accounts + profiles ----
  // Donor codes are computed locally (not via nextDonorCode(), which does a
  // read+write round trip) so seeding doesn't need 1000+ separate DB calls.
  let donorCodeCounter = 0;
  let reportCount = 0;

  for (let i = 0; i < 1000; i++) {
    const isMale = Math.random() < 0.55;
    const first = isMale ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
    const last = pick(LAST_NAMES);
    const fullName = `${first} ${last}`;
    const division = pick(DIVISION_NAMES);
    const address = pick(DIVISIONS[division]);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    const userId = uid("user");
    const password = bcrypt.hashSync("donor12345", 10);

    statements.push({
      sql: "INSERT INTO users (id, full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, 'user', ?)",
      args: [userId, fullName, email, password, randomPhone()],
    });

    const wants = pick(["donate", "find", "both", "both", "donate"]);
    const available = Math.random() < 0.7 ? 1 : 0;
    const totalDonations = randInt(0, 15);
    donorCodeCounter++;
    const donorCode = `GP-${String(donorCodeCounter).padStart(6, "0")}`;
    const donorId = uid("dp");

    statements.push({
      sql: `INSERT INTO donor_profiles
        (id, user_id, donor_code, full_name, blood_group, division, address, phone, nid, wants, last_donation_date, about, available, rating, total_donations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        donorId, userId, donorCode, fullName, weightedBloodGroup(), division, address, randomPhone(),
        randomNid(), wants, totalDonations > 0 ? randomDate(300) : null, pick(ABOUT_TEMPLATES), available,
        totalDonations > 0 ? Number((3.8 + Math.random() * 1.2).toFixed(1)) : 0, totalDonations,
      ],
    });

    // ~35% of donors have 1-3 uploaded reports on file (mostly clean, a few
    // flagged) so the compatibility checker + admin views have real data to
    // work with out of the box.
    if (Math.random() < 0.35) {
      const numReports = randInt(1, 3);
      const usedTypes = new Set();
      for (let j = 0; j < numReports; j++) {
        const testType = pick(TEST_TYPES);
        if (usedTypes.has(testType)) continue;
        usedTypes.add(testType);
        const result = Math.random() < 0.9 ? "Negative" : Math.random() < 0.7 ? "Positive" : "Pending";
        statements.push({
          sql: `INSERT INTO blood_test_reports (id, user_id, donor_profile_id, test_type, result, test_date, file_name, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            uid("rep"), userId, donorId, testType, result, randomDate(200),
            `${first.toLowerCase()}_${testType.split(" ")[0].toLowerCase()}_report.pdf`, "",
          ],
        });
        reportCount++;
      }
    }
  }

  statements.push({
    sql: "INSERT INTO counters (name, value) VALUES ('donor_code', ?)",
    args: [donorCodeCounter],
  });

  // ---- 100 blood banks spread across all divisions ----
  const bankNameParts = [
    "Sandhani Blood Bank", "Red Crescent Blood Center", "Quantum Blood Bank", "City Blood Bank",
    "Medical College Blood Center", "Central Blood Bank", "Life Care Blood Bank", "Unity Blood Bank",
    "Prime Blood Center", "Hope Blood Bank",
  ];
  for (let i = 0; i < 100; i++) {
    const division = DIVISION_NAMES[i % DIVISION_NAMES.length];
    const area = pick(DIVISIONS[division]);
    const name = `${pick(bankNameParts)} - ${division} ${i + 1}`;
    const stock = {};
    ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].forEach((g) => { stock[g] = randInt(0, 55); });
    statements.push({
      sql: "INSERT INTO blood_banks (id, name, address, phone, division, stock) VALUES (?, ?, ?, ?, ?, ?)",
      args: [uid("bb"), name, `${area}, ${division}`, `+8801${randInt(700000000, 799999999)}`, division, JSON.stringify(stock)],
    });
  }

  await runInChunks(statements);

  const adminCount = (await get("SELECT COUNT(*) c FROM users WHERE role='admin'")).c;
  const donorCount = (await get("SELECT COUNT(*) c FROM donor_profiles")).c;
  const bankCount = (await get("SELECT COUNT(*) c FROM blood_banks")).c;

  console.log("Seed complete:");
  console.log(" -", adminCount, "admin(s)");
  console.log(" -", donorCount, "donor profiles");
  console.log(" -", bankCount, "blood banks");
  console.log(" -", reportCount, "sample reports");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
