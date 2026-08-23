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

const TEST_CATEGORIES = [
  { category: "Infectious Screening", tests: ["HIV", "Hepatitis B", "Hepatitis C", "VDRL (Syphilis)", "Malaria"] },
  { category: "Red Blood Cell Disorders", tests: ["Anemia", "Sickle Cell Disease", "Polycythemia"] },
  { category: "White Blood Cell Disorders", tests: ["Leukopenia", "Leukocytosis", "Leukemia", "Lymphoma", "Multiple Myeloma"] },
  { category: "Platelet & Clotting Disorders", tests: ["Hemophilia", "Von Willebrand Disease", "Thrombocytopenia", "Thrombophilia"] },
];

function testCategoryOf(testType) {
  return TEST_CATEGORIES.find((c) => c.tests.includes(testType))?.category || "Other";
}

const DISEASE_BN = {
  HIV: "এইচআইভি (HIV)",
  "Hepatitis B": "হেপাটাইটিস বি",
  "Hepatitis C": "হেপাটাইটিস সি",
  "VDRL (Syphilis)": "সিফিলিস (ভিডিআরএল)",
  Malaria: "ম্যালেরিয়া",
  Anemia: "রক্তস্বল্পতা (অ্যানিমিয়া)",
  "Sickle Cell Disease": "সিকল সেল ডিজিজ",
  Polycythemia: "পলিসাইথেমিয়া",
  Leukopenia: "লিউকোপেনিয়া",
  Leukocytosis: "লিউকোসাইটোসিস",
  Leukemia: "লিউকেমিয়া (রক্ত ক্যান্সার)",
  Lymphoma: "লিম্ফোমা",
  "Multiple Myeloma": "মাল্টিপল মায়েলোমা",
  Hemophilia: "হিমোফিলিয়া",
  "Von Willebrand Disease": "ভন উইলেব্র্যান্ড ডিজিজ",
  Thrombocytopenia: "থ্রম্বোসাইটোপেনিয়া",
  Thrombophilia: "থ্রম্বোফিলিয়া",
};

const CATEGORY_INFO = {
  "Infectious Screening": {
    reasonEn: (names) =>
      `Any blood donation with a positive result for an infectious marker (${names}) is strictly prohibited, because the pathogen can be transmitted to the recipient through transfusion.`,
    reasonBn: (namesBn) =>
      `সংক্রামক চিহ্নিতকারীতে (${namesBn}) পজিটিভ ফলাফল থাকলে রক্তদান সম্পূর্ণ নিষিদ্ধ, কারণ সংক্রমণ রক্ত সঞ্চালনের মাধ্যমে গ্রহীতার মধ্যে ছড়িয়ে পড়তে পারে।`,
    recs: [
      "The donor must be immediately disqualified from donating blood.",
      "The donor is strongly advised to consult a healthcare professional for confirmatory testing and medical guidance.",
      "Follow standard medical protocols for handling potentially infectious biological samples.",
    ],
  },
  "Red Blood Cell Disorders": {
    reasonEn: (names) =>
      `A red blood cell disorder (${names}) was found. Donating blood can worsen the donor's own condition, and the unit's oxygen-carrying quality may not meet transfusion standards.`,
    reasonBn: (namesBn) =>
      `দাতার রক্তে লোহিত রক্তকণিকার সমস্যা (${namesBn}) পাওয়া গেছে। রক্ত দিলে দাতার নিজের অবস্থার অবনতি হতে পারে এবং সংগৃহীত রক্তের মান সঞ্চালনের মানদণ্ড পূরণ নাও করতে পারে।`,
    recs: [
      "The donor should be deferred from donating until a physician confirms it's safe.",
      "Refer the donor for haematology follow-up before any future donation attempt.",
    ],
  },
  "White Blood Cell Disorders": {
    reasonEn: (names) =>
      `A white blood cell disorder (${names}) was found, including possible blood cancer markers. Donors with these conditions are permanently deferred.`,
    reasonBn: (namesBn) =>
      `দাতার শ্বেত রক্তকণিকাজনিত সমস্যা (${namesBn}) পাওয়া গেছে, যার মধ্যে রক্ত ক্যান্সারের সম্ভাব্য লক্ষণও থাকতে পারে। এই অবস্থায় দাতাকে স্থায়ীভাবে রক্তদান থেকে বিরত রাখা হয়।`,
    recs: [
      "The donor must be permanently deferred from donating blood.",
      "Refer the donor to an oncologist or haematologist for full diagnostic work-up as soon as possible.",
    ],
  },
  "Platelet & Clotting Disorders": {
    reasonEn: (names) =>
      `A platelet or clotting disorder (${names}) was found. This can put the donor at risk of excessive bleeding or clotting, and may affect how safely the collected unit can be used.`,
    reasonBn: (namesBn) =>
      `দাতার রক্তে প্লাটিলেট বা রক্ত জমাট বাঁধার সমস্যা (${namesBn}) পাওয়া গেছে। এতে দান করার সময় বা পরে দাতার অতিরিক্ত রক্তক্ষরণ বা জমাট বাঁধার ঝুঁকি থাকতে পারে।`,
    recs: [
      "The donor should be deferred from donating until cleared by a haematologist.",
      "Advise the donor to seek medical evaluation for their clotting/platelet levels.",
    ],
  },
};

export const AI_DISCLAIMER_EN =
  "I am an AI, and I can sometimes make mistakes. Please consult a qualified doctor or blood-bank medical officer before making a final decision.";
export const AI_DISCLAIMER_BN =
  "আমি একটি এআই (AI), এবং আমি মাঝে মাঝে ভুল করতে পারি। চূড়ান্ত সিদ্ধান্ত নেওয়ার আগে অনুগ্রহ করে একজন যোগ্য ডাক্তার বা ব্লাড ব্যাংকের মেডিকেল অফিসারের সাথে পরামর্শ করুন।";

/**
 * Runs a rule-based "AI" safety assessment for a donor -> recipient blood
 * exchange, keyed by each person's unique donor_code so that two donors who
 * happen to share the same name are never confused with each other.
 */
export function assessBloodExchange({ donor, recipient, donorReports }) {
  const groupsCompatible = isCompatible(donor.blood_group, recipient.blood_group);
  const positiveReports = donorReports.filter((r) => r.result === "Positive");
  const pendingReports = donorReports.filter((r) => r.result === "Pending");
  const hasReports = donorReports.length > 0;
  const safe = groupsCompatible && positiveReports.length === 0;

  const sections = [];
  const recommendations = [];

  if (!groupsCompatible) {
    sections.push({
      en: `The blood groups themselves are not compatible: ${donor.blood_group} cannot safely be transfused into a recipient with ${recipient.blood_group}. Transfusing incompatible ABO/Rh groups can trigger a severe, potentially fatal immune reaction.`,
      bn: `রক্তের গ্রুপ নিজেই সামঞ্জস্যপূর্ণ নয়: ${donor.blood_group} গ্রুপ ${recipient.blood_group} গ্রুপের গ্রহীতাকে নিরাপদে দেওয়া যাবে না। বেমানান গ্রুপ সঞ্চালন করলে মারাত্মক প্রতিক্রিয়া হতে পারে।`,
    });
    recommendations.push("Do not proceed with this donor-recipient pairing.");
    recommendations.push("Search for a donor whose blood group is compatible with the recipient.");
  }

  if (positiveReports.length > 0) {
    const byCategory = {};
    positiveReports.forEach((r) => {
      const cat = testCategoryOf(r.test_type);
      byCategory[cat] = byCategory[cat] || [];
      byCategory[cat].push(r.test_type);
    });
    Object.entries(byCategory).forEach(([cat, tests]) => {
      const info = CATEGORY_INFO[cat];
      if (!info) return;
      const names = tests.join(", ");
      const namesBn = tests.map((t) => DISEASE_BN[t] || t).join(", ");
      sections.push({ en: info.reasonEn(names), bn: info.reasonBn(namesBn) });
      info.recs.forEach((rec) => {
        if (!recommendations.includes(rec)) recommendations.push(rec);
      });
    });
  }

  if (sections.length === 0) {
    sections.push({
      en: "The blood groups are compatible and no positive findings were found across the donor's uploaded reports.",
      bn: "রক্তের গ্রুপ সামঞ্জস্যপূর্ণ এবং দাতার আপলোড করা রিপোর্টে কোনো পজিটিভ ফলাফল পাওয়া যায়নি।",
    });
    recommendations.push("Proceed with standard pre-donation screening at the time of transfusion.");
  }

  if (pendingReports.length > 0) {
    recommendations.push(
      `Results for ${pendingReports.map((r) => r.test_type).join(", ")} are still pending — confirm before finalizing.`
    );
  }

  return {
    donorCode: donor.donor_code,
    recipientCode: recipient.donor_code,
    groupsCompatible,
    safe,
    hasReports,
    reportsConsidered: donorReports.length,
    positiveFindings: positiveReports.map((r) => r.test_type),
    pendingFindings: pendingReports.map((r) => r.test_type),
    headline: sections.map((s) => s.en).join(" "),
    headlineBn: sections.map((s) => s.bn).join(" "),
    recommendations,
    needsCaution: !hasReports,
    disclaimerEn: AI_DISCLAIMER_EN,
    disclaimerBn: AI_DISCLAIMER_BN,
  };
}

/**
 * Analyses ALL of a donor's saved medical reports (not just one pairing) to
 * produce an overall donor-health summary -- used on the donor's own
 * dashboard so they can see what the AI makes of their full report history.
 */
export function analyzeDonorReports(reports) {
  if (reports.length === 0) {
    return {
      status: "no_reports",
      summaryEn: "No medical reports have been uploaded yet.",
      summaryBn: "এখনো কোনো মেডিকেল রিপোর্ট আপলোড করা হয়নি।",
      flags: [],
      disclaimerEn: AI_DISCLAIMER_EN,
      disclaimerBn: AI_DISCLAIMER_BN,
    };
  }

  const positives = reports.filter((r) => r.result === "Positive");
  const pending = reports.filter((r) => r.result === "Pending");
  const flags = positives.map((r) => ({
    testType: r.test_type,
    category: testCategoryOf(r.test_type),
    testDate: r.test_date,
  }));

  let status = "eligible";
  if (positives.length > 0) status = "deferred";
  else if (pending.length > 0) status = "pending_review";

  const summaryEn =
    status === "deferred"
      ? `Across ${reports.length} saved report(s), the AI found ${positives.length} positive finding(s): ${positives
          .map((r) => r.test_type)
          .join(", ")}. Based on standard donation rules, this donor should currently be deferred from donating.`
      : status === "pending_review"
      ? `Across ${reports.length} saved report(s), no positive findings were detected, but ${pending.length} result(s) are still pending: ${pending
          .map((r) => r.test_type)
          .join(", ")}.`
      : `Across ${reports.length} saved report(s), no positive findings were detected. This donor currently appears eligible to donate, subject to standard in-person screening.`;

  const summaryBn =
    status === "deferred"
      ? `${reports.length}টি সংরক্ষিত রিপোর্ট বিশ্লেষণ করে এআই ${positives.length}টি পজিটিভ ফলাফল খুঁজে পেয়েছে: ${positives
          .map((r) => r.test_type)
          .join(", ")}। স্বাভাবিক নিয়ম অনুযায়ী, এই দাতাকে বর্তমানে রক্তদান থেকে বিরত রাখা উচিত।`
      : status === "pending_review"
      ? `${reports.length}টি সংরক্ষিত রিপোর্টে কোনো পজিটিভ ফলাফল পাওয়া যায়নি, তবে ${pending.length}টি ফলাফল এখনো পেন্ডিং রয়েছে।`
      : `${reports.length}টি সংরক্ষিত রিপোর্টে কোনো পজিটিভ ফলাফল পাওয়া যায়নি। এই দাতা বর্তমানে রক্তদানের জন্য উপযুক্ত বলে মনে হচ্ছে, তবে সরাসরি পরীক্ষার সাপেক্ষে।`;

  return {
    status,
    summaryEn,
    summaryBn,
    flags,
    reportsConsidered: reports.length,
    disclaimerEn: AI_DISCLAIMER_EN,
    disclaimerBn: AI_DISCLAIMER_BN,
  };
}
