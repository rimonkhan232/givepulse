export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const TEST_CATEGORIES = [
  {
    category: "Infectious Screening",
    tests: ["HIV", "Hepatitis B", "Hepatitis C", "VDRL (Syphilis)", "Malaria"],
  },
  {
    category: "Red Blood Cell Disorders",
    tests: ["Anemia", "Sickle Cell Disease", "Polycythemia"],
  },
  {
    category: "White Blood Cell Disorders",
    tests: ["Leukopenia", "Leukocytosis", "Leukemia", "Lymphoma", "Multiple Myeloma"],
  },
  {
    category: "Platelet & Clotting Disorders",
    tests: ["Hemophilia", "Von Willebrand Disease", "Thrombocytopenia", "Thrombophilia"],
  },
];

export const TEST_TYPES = TEST_CATEGORIES.flatMap((c) => c.tests);

export function testCategoryOf(testType) {
  return TEST_CATEGORIES.find((c) => c.tests.includes(testType))?.category || "Other";
}

export const DIVISIONS = [
  "Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi",
  "Barisal", "Rangpur", "Mymensingh",
];

// donor group -> recipient groups it can give to
const CAN_DONATE_TO = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export function isCompatible(donorGroup, recipientGroup) {
  if (!donorGroup || !recipientGroup) return null;
  return CAN_DONATE_TO[donorGroup]?.includes(recipientGroup) ?? false;
}

export function compatibleRecipients(donorGroup) {
  return CAN_DONATE_TO[donorGroup] || [];
}

export function compatibleDonors(recipientGroup) {
  return Object.entries(CAN_DONATE_TO)
    .filter(([, canGive]) => canGive.includes(recipientGroup))
    .map(([donor]) => donor);
}

export function daysBetween(dateA, dateB = new Date()) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

export function eligibleToDonate(lastDonationDate) {
  if (!lastDonationDate) return { eligible: true, daysLeft: 0 };
  const days = daysBetween(lastDonationDate);
  const waitPeriod = 90;
  const daysLeft = Math.max(0, waitPeriod - days);
  return { eligible: daysLeft === 0, daysLeft };
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
