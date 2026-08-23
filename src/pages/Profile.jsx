import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Save, User as UserIcon, CheckCircle2, ArrowRight, Hash, Pencil, IdCard,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { BLOOD_GROUPS, DIVISIONS, eligibleToDonate, initials, formatDate } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";
import { isProfileComplete } from "../components/RequireOnboarding";

const emptyForm = {
  fullName: "",
  bloodGroup: "O+",
  division: "Dhaka",
  phone: "",
  address: "",
  nid: "",
  wants: "both",
  lastDonationDate: "",
  about: "",
};

export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onboarding = location.state?.onboarding;

  const [loading, setLoading] = useState(true);
  const [donorCode, setDonorCode] = useState("");
  const [form, setForm] = useState({ ...emptyForm, fullName: user.fullName });
  const [saved, setSaved] = useState(null); // last-saved snapshot, shown in view mode
  const [mode, setMode] = useState("edit"); // 'edit' | 'view'
  const [status, setStatus] = useState("idle"); // idle | saving | error
  const [errorMessage, setErrorMessage] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { donor } = await api.donors.me();
        if (donor) {
          setDonorCode(donor.donorCode);
          const loaded = {
            fullName: donor.fullName || user.fullName,
            bloodGroup: donor.bloodGroup || "O+",
            division: donor.division || "Dhaka",
            phone: donor.phone || "",
            address: donor.address || "",
            nid: donor.nid || "",
            wants: donor.wants || "both",
            lastDonationDate: donor.lastDonationDate || "",
            about: donor.about || "",
          };
          setForm(loaded);
          // If the profile is already complete and we're not in the
          // mandatory onboarding flow, land on the read-only view instead
          // of dropping the person straight into an edit form.
          if (!onboarding && isProfileComplete(donor)) {
            setSaved(loaded);
            setMode("view");
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { eligible, daysLeft } = eligibleToDonate(form.lastDonationDate);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    try {
      const { donor } = await api.donors.updateMe(form);
      setStatus("idle");
      setSaved(form);

      if (onboarding && isProfileComplete(donor)) {
        // Step 1 done -- move straight on to the mandatory report step.
        navigate("/reports", { state: { onboarding: true, from: location.state?.from } });
        return;
      }

      // Normal (non-onboarding) save: show a confirmation, then switch to
      // the read-only summary instead of leaving the form sitting open.
      setJustSaved(true);
      setMode("view");
      setTimeout(() => setJustSaved(false), 2600);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Couldn't save your profile. Please check your connection and try again.");
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">My Profile</h1>
          {donorCode && (
            <span className="inline-flex items-center gap-1 font-mono text-xs bg-crimson-50 text-crimson-700 px-2 py-0.5 rounded-md mt-1.5">
              <Hash size={11} /> {donorCode}
            </span>
          )}
        </div>
        <AnimatePresence mode="wait">
          {justSaved && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full"
            >
              <CheckCircle2 size={14} /> Saved successfully
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {onboarding && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-crimson-50 border border-crimson-200 text-crimson-800 text-sm px-4 py-3 rounded-xl"
        >
          <p className="font-semibold">Step 1 of 2 — Welcome to GivePulse.</p>
          <p className="mt-1 text-crimson-700/80">
            Fill in your details below, then you'll upload at least one blood test report to unlock
            the rest of the site.
          </p>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"
        >
          {errorMessage}
        </motion.div>
      )}

      {mode === "view" && saved ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-crimson-100 text-crimson-700 font-bold text-lg flex items-center justify-center">
                {initials(saved.fullName) || <UserIcon size={22} />}
              </div>
              <div>
                <p className="font-display font-semibold text-crimson-950 text-lg">{saved.fullName}</p>
                <BloodGroupBadge group={saved.bloodGroup} size="sm" />
              </div>
            </div>
            <button
              onClick={() => setMode("edit")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-700 bg-crimson-50 hover:bg-crimson-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>

          {!eligible && saved.lastDonationDate && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertTriangle size={16} /> {daysLeft} day(s) remaining before you're eligible to donate again.
            </div>
          )}

          <dl className="text-sm divide-y divide-crimson-50">
            {[
              ["Division", saved.division],
              ["Phone Number", saved.phone],
              ["Address", saved.address],
              ["National ID (NID)", saved.nid],
              ["I want to", saved.wants === "both" ? "Donate & Find Blood" : saved.wants === "donate" ? "Donate Blood" : "Find Blood"],
              ["Last Donation Date", saved.lastDonationDate ? formatDate(saved.lastDonationDate) : "No record"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 gap-4">
                <dt className="text-crimson-900/50 shrink-0">{label}</dt>
                <dd className="text-crimson-950 font-medium text-right">{value || "—"}</dd>
              </div>
            ))}
            {saved.about && (
              <div className="py-2.5">
                <dt className="text-crimson-900/50 mb-1">About Me</dt>
                <dd className="text-crimson-950">{saved.about}</dd>
              </div>
            )}
          </dl>
        </motion.div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-crimson-100 text-crimson-700 font-bold text-lg flex items-center justify-center">
              {initials(form.fullName) || <UserIcon size={22} />}
            </div>
            <BloodGroupBadge group={form.bloodGroup} />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Full Name <span className="text-red-500">*</span></label>
            <input
              required
              value={form.fullName}
              onChange={set("fullName")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-crimson-950">Blood Group <span className="text-red-500">*</span></label>
              <select
                value={form.bloodGroup}
                onChange={set("bloodGroup")}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              >
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-crimson-950">Division <span className="text-red-500">*</span></label>
              <select
                value={form.division}
                onChange={set("division")}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              >
                {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Phone Number <span className="text-red-500">*</span></label>
            <input
              required
              value={form.phone}
              onChange={set("phone")}
              placeholder="01XXXXXXXXX"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Address <span className="text-red-500">*</span></label>
            <input
              required
              value={form.address}
              onChange={set("address")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950 flex items-center gap-1.5">
              <IdCard size={14} /> National ID (NID) Number <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.nid}
              onChange={set("nid")}
              placeholder="e.g. 1234567890123"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
            <p className="text-xs text-crimson-900/40 mt-1.5">
              Used to verify your identity and, if ever needed, to act on a confirmed complaint. Never shown to other users.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">I want to <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3 mt-1.5">
              {[
                { key: "donate", label: "Donate Blood" },
                { key: "find", label: "Find Blood" },
                { key: "both", label: "Both" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setForm((f) => ({ ...f, wants: opt.key }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.wants === opt.key
                      ? "border-crimson-600 bg-crimson-50 text-crimson-700"
                      : "border-crimson-100 text-crimson-900/60 hover:border-crimson-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">Last Donation Date</label>
            <input
              type="date"
              value={form.lastDonationDate || ""}
              onChange={set("lastDonationDate")}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-crimson-950">About Me</label>
            <textarea
              value={form.about}
              onChange={set("about")}
              rows={3}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            {mode === "edit" && saved && !onboarding && (
              <button
                type="button"
                onClick={() => {
                  setForm(saved);
                  setMode("view");
                }}
                className="px-5 py-3 rounded-xl border border-crimson-200 text-crimson-700 font-semibold hover:bg-crimson-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={status === "saving"}
              className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === "saving" ? (
                "Saving…"
              ) : onboarding ? (
                <>Continue to reports <ArrowRight size={16} /></>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
