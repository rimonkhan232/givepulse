import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplet, Users, Activity, HeartPulse, ArrowRight, Bell, Hash, FileText, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";
import LocationPrompt from "../components/LocationPrompt";
import { eligibleToDonate, formatDate } from "../lib/bloodUtils";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [donorTotal, setDonorTotal] = useState(0);
  const [bankTotal, setBankTotal] = useState(0);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ donor }, { total: dTotal }, { total: bTotal }, { requests: reqRows }, { reports: repRows }] =
        await Promise.all([
          api.donors.me(),
          api.donors.list({ limit: 1 }),
          api.bloodBanks.list({ limit: 1 }),
          api.requests.list({ status: "open", limit: 4 }),
          api.reports.mine(),
        ]);
      setProfile(donor);
      setDonorTotal(dTotal);
      setBankTotal(bTotal);
      setRequests(reqRows);
      setReports(repRows);
      if (donor) {
        const { donations: donRows } = await api.donations.list({ donorId: donor.id });
        setDonations(donRows);
      }
      setLoading(false);
    })();
  }, []);

  const { eligible, daysLeft } = eligibleToDonate(profile?.lastDonationDate);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LocationPrompt />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-brand p-8 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm">Good to see you,</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1">{user.fullName}</h1>
            {profile?.donorCode && (
              <span className="inline-flex items-center gap-1 font-mono text-xs bg-white/15 px-2 py-0.5 rounded-md mt-1">
                <Hash size={11} /> {profile.donorCode}
              </span>
            )}
            {profile?.bloodGroup && (
              <div className="flex items-center gap-3 mt-4">
                <BloodGroupBadge group={profile.bloodGroup} />
                <div>
                  <p className="text-sm font-medium">{profile.division}</p>
                  <p className="text-xs text-white/60">
                    {eligible ? "Eligible to donate now" : `${daysLeft} day(s) until eligible`}
                  </p>
                </div>
              </div>
            )}
          </div>
          <Link
            to="/requests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-crimson-700 font-semibold text-sm hover:bg-crimson-50 transition-colors self-start"
          >
            View blood requests <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Donors nearby" value={donorTotal} delay={0} />
        <StatCard icon={Droplet} label="Blood banks" value={bankTotal} tint="bg-crimson-700" delay={0.05} />
        <StatCard icon={Activity} label="Open requests" value={requests.length} tint="bg-crimson-800" delay={0.1} />
        <StatCard icon={HeartPulse} label="Your donations" value={donations.length} tint="bg-crimson-900" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-crimson-950">Urgent requests</h2>
            <Link to="/requests" className="text-sm font-semibold text-crimson-700 hover:underline">
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {requests.length === 0 && (
              <p className="text-sm text-crimson-900/50 py-6 text-center">No open requests right now.</p>
            )}
            {requests.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-crimson-100 hover:bg-crimson-50/60 transition-colors"
              >
                <BloodGroupBadge group={r.bloodGroup} size="sm" pulse={r.urgency === "Urgent"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-crimson-950">{r.location}</p>
                  <p className="text-xs text-crimson-900/50">
                    {r.units} unit(s) &middot; {r.requesterName} &middot; {formatDate(r.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    r.urgency === "Urgent" ? "bg-amber-100 text-amber-700" : "bg-crimson-50 text-crimson-700"
                  }`}
                >
                  {r.urgency}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-crimson-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-crimson-600" />
            <h2 className="font-display font-semibold text-crimson-950">Quick actions</h2>
          </div>
          <div className="space-y-2">
            <Link to="/requests" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Post a blood request
            </Link>
            <Link to="/reports" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Manage test reports
            </Link>
            <Link to="/compatibility" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Check compatibility
            </Link>
            <Link to="/profile" className="block px-4 py-3 rounded-xl bg-crimson-50 text-crimson-800 text-sm font-medium hover:bg-crimson-100 transition-colors">
              Update availability
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Personal details + saved medical reports, right on the dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <div className="bg-white rounded-2xl border border-crimson-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-crimson-950">Personal details</h2>
            <Link to="/profile" className="text-xs font-semibold text-crimson-700 hover:underline">Edit</Link>
          </div>
          <dl className="text-sm space-y-2.5">
            <div className="flex justify-between"><dt className="text-crimson-900/50">Donor ID</dt><dd className="font-mono text-xs text-crimson-800">{profile?.donorCode}</dd></div>
            <div className="flex justify-between"><dt className="text-crimson-900/50">Blood group</dt><dd className="font-semibold text-crimson-950">{profile?.bloodGroup || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-crimson-900/50">Division</dt><dd className="text-crimson-950">{profile?.division || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-crimson-900/50">Phone</dt><dd className="text-crimson-950">{profile?.phone || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-crimson-900/50">Address</dt><dd className="text-crimson-950 text-right">{profile?.address || "—"}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-crimson-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-crimson-600" />
              <h2 className="font-display font-semibold text-crimson-950">Saved medical reports ({reports.length})</h2>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-crimson-700 hover:underline">Manage</Link>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-crimson-900/40 py-4">No reports saved yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {reports.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span className="text-crimson-950">{r.testType}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.result === "Negative" ? "bg-emerald-50 text-emerald-700" : r.result === "Positive" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}>{r.result}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/reports" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-700 bg-crimson-50 px-3 py-1.5 rounded-lg hover:bg-crimson-100">
            <Sparkles size={12} /> Ask AI to analyze my reports
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
