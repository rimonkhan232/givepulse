import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar,
} from "recharts";
import { ShieldCheck, Users, Droplet, Activity, FileText } from "lucide-react";
import { api } from "../lib/api";
import { TEST_CATEGORIES, testCategoryOf } from "../lib/bloodUtils";
import PulseMark from "../components/PulseMark";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [statsRes, reportsRes] = await Promise.all([api.admin.stats(), api.admin.reports()]);
      setStats(statsRes);
      setReports(reportsRes.reports);
      setLoading(false);
    })();
  }, []);

  const diseaseByCategory = useMemo(() => {
    return TEST_CATEGORIES.map((cat) => ({
      category: cat.category.replace(" Disorders", "").replace(" Screening", ""),
      positive: reports.filter((r) => r.result === "Positive" && testCategoryOf(r.testType) === cat.category).length,
    }));
  }, [reports]);

  const diseaseByType = useMemo(() => {
    const positives = reports.filter((r) => r.result === "Positive");
    const counts = {};
    positives.forEach((r) => { counts[r.testType] = (counts[r.testType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const positiveCount = reports.filter((r) => r.result === "Positive").length;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-admin p-8 text-white flex items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <ShieldCheck size={26} />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-white/70 text-sm mt-1">Live platform overview, backed by the SQLite database</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Registered users", value: stats.users },
          { icon: Droplet, label: "Blood banks", value: stats.banks },
          { icon: Activity, label: "Open requests", value: stats.openRequests },
          { icon: FileText, label: "Reports on file", value: stats.reports },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-sky-100 p-5">
            <s.icon size={18} className="text-sky-600" />
            <p className="text-xl font-display font-bold text-sky-950 mt-2">{s.value.toLocaleString()}</p>
            <p className="text-xs text-sky-900/50">{s.label}</p>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-sky-100 p-6">
        <h2 className="font-display font-semibold text-sky-950 mb-1">Blood Disease Detection Rate</h2>
        <p className="text-xs text-sky-900/40 mb-4">
          Positive findings by disorder category, across all {reports.length} saved report(s).
        </p>
        {positiveCount === 0 ? (
          <p className="text-sm text-sky-900/40 text-center py-16">No positive findings on record</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diseaseByCategory} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#0369a1" fontSize={12} />
              <YAxis type="category" dataKey="category" stroke="#0369a1" fontSize={11} width={140} />
              <Tooltip />
              <Bar dataKey="positive" name="Positive cases" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {diseaseByType.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-sky-100 p-6">
          <h2 className="font-display font-semibold text-sky-950 mb-4">Positive Cases by Specific Condition</h2>
          <div className="flex flex-wrap gap-2">
            {diseaseByType.map((d) => (
              <span
                key={d.name}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-100"
              >
                {d.name}
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                  {d.value}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-sky-100 p-6">
        <h2 className="font-display font-semibold text-sky-950 mb-4">Donors by blood group</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Object.entries(stats.byGroup).map(([g, c]) => (
            <div key={g} className="rounded-xl bg-sky-50 text-center py-3">
              <p className="text-xs font-bold text-sky-700">{g}</p>
              <p className="text-sm font-semibold text-sky-950">{c}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
