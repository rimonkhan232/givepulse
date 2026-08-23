import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, ShieldCheck, ShieldAlert, MapPin, ShieldOff, ShieldQuestion } from "lucide-react";
import { api } from "../lib/api";
import { initials } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";

export default function AdminDonors() {
  const [query, setQuery] = useState("");
  const [donors, setDonors] = useState([]);
  const [reportIds, setReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadDonors = async (q) => {
    const { donors: rows } = await api.admin.donors({ q: q || undefined, limit: 500 });
    setDonors(rows);
  };

  useEffect(() => {
    (async () => {
      const [{ donorProfileIds }] = await Promise.all([api.admin.donorsWithReports(), loadDonors()]);
      setReportIds(new Set(donorProfileIds));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadDonors(query), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => donors, [donors]);

  const hasReport = (donor) => reportIds.has(donor.id);

  const toggleAvailability = async (donor) => {
    await api.admin.updateDonor(donor.id, { available: !donor.available });
    setDonors((prev) => prev.map((d) => (d.id === donor.id ? { ...d, available: !d.available } : d)));
  };

  const removeDonor = async (donor) => {
    if (!window.confirm(`Remove ${donor.fullName} from the donor directory?`)) return;
    await api.admin.deleteDonor(donor.id);
    setDonors((prev) => prev.filter((d) => d.id !== donor.id));
  };

  const toggleBlacklist = async (donor) => {
    const next = !donor.blacklisted;
    if (next && !window.confirm(`Blacklist ${donor.fullName}? They'll be hidden from the public donor directory.`)) return;
    await api.admin.blacklistDonor(donor.id, next);
    setDonors((prev) => prev.map((d) => (d.id === donor.id ? { ...d, blacklisted: next } : d)));
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
          <h1 className="text-2xl font-display font-bold text-sky-950">Donors</h1>
          <p className="text-sm text-sky-900/50 mt-1">{filtered.length} registered donor(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, unique donor ID, or division..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-sky-200 focus-ring-admin text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold text-sky-900/50 uppercase tracking-wide border-b border-sky-100">
          <span>Donor</span>
          <span>Group</span>
          <span>Report</span>
          <span>Status</span>
          <span>Blacklist</span>
          <span></span>
        </div>
        <AnimatePresence>
          {filtered.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-sky-50 last:border-0 ${
                d.blacklisted ? "bg-red-50/40" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {initials(d.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sky-950 truncate">{d.fullName}</p>
                  <p className="text-xs text-sky-900/40 flex items-center gap-1">
                    <MapPin size={10} /> {d.division} &middot; <span className="font-mono">{d.donorCode}</span>
                  </p>
                </div>
              </div>

              <BloodGroupBadge group={d.bloodGroup} size="sm" theme="admin" />

              {hasReport(d) ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} /> On file
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                  <ShieldAlert size={12} /> Missing
                </span>
              )}

              <button
                onClick={() => toggleAvailability(d)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  d.available ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {d.available ? "Available" : "Unavailable"}
              </button>

              <button
                onClick={() => toggleBlacklist(d)}
                title={d.blacklisted ? "Remove from blacklist" : "Blacklist this donor"}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  d.blacklisted ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {d.blacklisted ? <ShieldOff size={12} /> : <ShieldQuestion size={12} />}
                {d.blacklisted ? "Blacklisted" : "Clean"}
              </button>

              <button
                onClick={() => removeDonor(d)}
                className="justify-self-end p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remove donor"
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-sm text-sky-900/40 text-center py-10">No donors match your search.</p>
        )}
      </div>
    </div>
  );
}
