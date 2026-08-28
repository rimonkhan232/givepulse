import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, MessageSquare, Users, Hash } from "lucide-react";
import { api } from "../lib/api";
import { BLOOD_GROUPS, DIVISIONS, initials } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";
import { useLanguage } from "../context/LanguageContext";

export default function Donors() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [division, setDivision] = useState("All");
  const [donors, setDonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Server-side filtering keeps this fast even with 1000+ donor records --
  // the client never has to download the whole directory.
  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(async () => {
      const { donors: rows, total: t2 } = await api.donors.list({
        q: query || undefined,
        bloodGroup: group === "All" ? undefined : group,
        division: division === "All" ? undefined : division,
        limit: 60,
      });
      setDonors(rows);
      setTotal(t2);
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query, group, division]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">{t("findDonors")}</h1>
          <p className="text-sm text-crimson-900/50 mt-1">{total.toLocaleString()} donor(s) total{donors.length < total ? ` · showing ${donors.length}` : ""}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-crimson-100 p-5 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crimson-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, unique donor ID, or location..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-crimson-200 focus-ring text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring bg-white"
          >
            <option value="All">All Blood Groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring bg-white"
          >
            <option value="All">All Divisions</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><PulseMark size={44} ring /></div>
      ) : donors.length === 0 ? (
        <div className="text-center py-20 text-crimson-900/40">
          <Users size={40} className="mx-auto mb-3" />
          <p>No donors match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {donors.map((donor, i) => (
              <motion.div
                key={donor.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-white rounded-2xl border border-crimson-100 p-5 card-lift"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-crimson-100 text-crimson-700 font-bold flex items-center justify-center">
                      {initials(donor.fullName)}
                    </div>
                    <div>
                      <p className="font-semibold text-crimson-950">{donor.fullName.toUpperCase()}</p>
                      <p className="text-xs text-crimson-900/50 flex items-center gap-1">
                        <MapPin size={11} /> {donor.division}
                      </p>
                    </div>
                  </div>
                  <BloodGroupBadge group={donor.bloodGroup} size="sm" />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      donor.available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${donor.available ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {donor.available ? "Available" : "Unavailable"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-crimson-900/40">
                    <Hash size={10} /> {donor.donorCode}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Link
                    to={`/donors/${donor.id}`}
                    className="flex-1 text-center py-2 rounded-xl border border-crimson-200 text-crimson-700 text-sm font-semibold hover:bg-crimson-50 transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/messages"
                    state={{ withId: donor.id }}
                    className="w-10 h-10 shrink-0 rounded-xl gradient-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
