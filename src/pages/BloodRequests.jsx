import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Clock, MessageCircle, X, Activity, FileWarning, LocateFixed, Globe } from "lucide-react";
import { api } from "../lib/api";
import { BLOOD_GROUPS, formatDate } from "../lib/bloodUtils";
import { useAuth } from "../context/AuthContext";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";
import { useLanguage } from "../context/LanguageContext";
import { getDetectedDivision } from "../lib/geo";

export default function BloodRequests() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState("nearMe"); // 'nearMe' | 'all'
  const [myDivision, setMyDivision] = useState("");
  const [usingGeoDivision, setUsingGeoDivision] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasReports, setHasReports] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bloodGroup: "O+",
    units: 1,
    location: "",
    urgency: "Urgent",
    neededBy: "As fast as possible",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const [{ requests: rows }, { reports }, { donor }] = await Promise.all([
        api.requests.list(),
        api.reports.mine(),
        api.donors.me(),
      ]);
      setRequests(rows);
      setHasReports(reports.length > 0);
      // Prefer a GPS-detected division (from the dashboard's "share your
      // location" popup) over the one typed into the profile, if we have
      // one -- it reflects where the person actually is right now.
      const geo = getDetectedDivision();
      if (geo?.division) {
        setMyDivision(geo.division);
        setUsingGeoDivision(true);
      } else {
        setMyDivision(donor?.division || "");
      }
      setLoading(false);
    })();
  }, []);

  const visibleRequests = useMemo(() => {
    if (tab === "nearMe" && myDivision) {
      return requests.filter((r) => r.division === myDivision);
    }
    return requests;
  }, [requests, tab, myDivision]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hasReports || submitting) return;
    setSubmitting(true);
    try {
      const { request: created } = await api.requests.create({ ...form, units: Number(form.units) });
      setRequests((prev) => [created, ...prev]);
      setOpen(false);
      setForm({ bloodGroup: "O+", units: 1, location: "", urgency: "Urgent", neededBy: "As fast as possible", notes: "" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">{t("requests")}</h1>
          <p className="text-sm text-crimson-900/50 mt-1">
            {visibleRequests.length} request(s){tab === "nearMe" && myDivision ? ` in ${myDivision}` : ""}
            {tab === "nearMe" && myDivision && usingGeoDivision && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-crimson-700 bg-crimson-50 px-1.5 py-0.5 rounded-full align-middle">
                <LocateFixed size={9} /> via GPS
              </span>
            )}
          </p>
        </div>
        {hasReports ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Create Request
          </button>
        ) : (
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors"
          >
            <FileWarning size={16} /> Add a report to post a request
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("nearMe")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === "nearMe" ? "gradient-brand text-white" : "bg-white text-crimson-900/60 border border-crimson-100 hover:bg-crimson-50"
          }`}
        >
          <LocateFixed size={14} /> Near Me
        </button>
        <button
          onClick={() => setTab("all")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === "all" ? "gradient-brand text-white" : "bg-white text-crimson-900/60 border border-crimson-100 hover:bg-crimson-50"
          }`}
        >
          <Globe size={14} /> All Requests
        </button>
      </div>

      {!hasReports && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl">
          <FileWarning size={18} className="shrink-0 mt-0.5" />
          <p>
            To keep exchanges safe, posting a blood request requires at least one saved blood test
            report on file. <Link to="/reports" className="font-semibold underline">Add one now</Link>.
          </p>
        </div>
      )}

      {visibleRequests.length === 0 ? (
        <div className="text-center py-20 text-crimson-900/40">
          <Activity size={40} className="mx-auto mb-3" />
          <p>
            {tab === "nearMe"
              ? `No open requests in ${myDivision || "your division"} right now.`
              : "No blood requests yet. Be the first to post one."}
          </p>
          {tab === "nearMe" && (
            <button onClick={() => setTab("all")} className="mt-2 text-sm font-semibold text-crimson-700 hover:underline">
              See all requests instead
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibleRequests.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-crimson-100 p-5 card-lift relative"
              >
                {r.urgency === "Urgent" && (
                  <span className="absolute top-5 right-5 text-[11px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    Urgent
                  </span>
                )}
                <BloodGroupBadge group={r.bloodGroup} pulse={r.urgency === "Urgent"} />
                <p className="mt-3 text-sm font-semibold text-crimson-950">{r.units} unit(s)</p>
                <p className="text-sm text-crimson-900/60 flex items-center gap-1.5 mt-2">
                  <MapPin size={13} /> {r.location}
                </p>
                <p className="text-sm text-crimson-900/60 flex items-center gap-1.5 mt-1">
                  <Clock size={13} /> {formatDate(r.createdAt)}
                </p>
                {r.notes && <p className="text-xs text-crimson-900/50 mt-2 italic">"{r.notes}"</p>}
                <p className="text-sm text-crimson-900/50 mt-2">{r.neededBy}</p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-crimson-100">
                  <span className="text-xs font-semibold text-crimson-800">{r.requesterName}</span>
                  {r.requesterId === user.id ? (
                    <span className="text-xs text-crimson-900/30">Your request</span>
                  ) : (
                    <Link
                      to="/messages"
                      state={{ withId: r.requesterDonorId || r.requesterId }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-700 hover:underline"
                    >
                      <MessageCircle size={13} /> Contact
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-crimson-950">Create Blood Request</h2>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-crimson-50 text-crimson-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Blood group</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    >
                      {BLOOD_GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Units needed</label>
                    <input
                      type="number"
                      min="1"
                      value={form.units}
                      onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-crimson-950">Location</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Khilkhet, Dhaka"
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Urgency</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    >
                      <option>Urgent</option>
                      <option>Moderate</option>
                      <option>Planned</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-crimson-950">Needed by</label>
                    <input
                      value={form.neededBy}
                      onChange={(e) => setForm((f) => ({ ...f, neededBy: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-crimson-950">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting ? "Posting…" : "Post request"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
