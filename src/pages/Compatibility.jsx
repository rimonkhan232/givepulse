import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, CheckCircle2, XCircle, User, ShieldAlert, ArrowRight, Info, Search } from "lucide-react";
import { api } from "../lib/api";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";

export default function Compatibility() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [donorId, setDonorId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [assessment, setAssessment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { donors: rows } = await api.donors.list({ limit: 500 });
      setDonors(rows);
      setLoading(false);
    })();
  }, []);

  // Search narrows the two dropdowns by name OR unique donor code -- this
  // is how the AI tells two same-named people apart: never by name alone.
  const filtered = query
    ? donors.filter(
        (d) =>
          d.fullName.toLowerCase().includes(query.toLowerCase()) ||
          d.donorCode.toLowerCase().includes(query.toLowerCase())
      )
    : donors;

  const donor = donors.find((d) => d.id === donorId);
  const recipient = donors.find((d) => d.id === recipientId);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!donor || !recipient) return;
    setChecking(true);
    setError("");
    try {
      const { assessment: result } = await api.compatibility.check(donorId, recipientId);
      setAssessment(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl gradient-brand text-white flex items-center justify-center">
          <FlaskConical size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-crimson-950">Blood Compatibility Checker</h1>
          <p className="text-sm text-crimson-900/50">AI-powered analysis of blood test reports to determine if a blood exchange is safe.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><PulseMark size={44} ring /></div>
      ) : (
        <>
          <div className="mt-6 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or unique donor ID (e.g. GP-000123)…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring bg-white"
            />
          </div>

          <form onSubmit={handleCheck} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-3 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-crimson-950 flex items-center gap-1.5">
                  <User size={14} /> Donor
                </label>
                <select
                  value={donorId}
                  onChange={(e) => { setDonorId(e.target.value); setAssessment(null); }}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                >
                  <option value="">Select a donor</option>
                  {filtered.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName} · {d.donorCode} ({d.bloodGroup})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-crimson-950 flex items-center gap-1.5">
                  <User size={14} /> Recipient
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => { setRecipientId(e.target.value); setAssessment(null); }}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                >
                  <option value="">Select a recipient</option>
                  {filtered.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName} · {d.donorCode} ({d.bloodGroup})</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={!donorId || !recipientId || checking}
              className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <FlaskConical size={16} /> {checking ? "Checking…" : "Check Compatibility"}
            </button>
          </form>
        </>
      )}

      <AnimatePresence>
        {assessment && donor && recipient && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Compatibility banner */}
            <div
              className={`rounded-2xl p-6 border ${
                assessment.groupsCompatible ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <BloodGroupBadge group={donor.bloodGroup} size="sm" />
                  <span className="text-xs font-mono text-crimson-900/50">{assessment.donorCode}</span>
                </div>
                <ArrowRight size={16} className="text-crimson-900/30" />
                <div className="flex items-center gap-2">
                  <BloodGroupBadge group={recipient.bloodGroup} size="sm" />
                  <span className="text-xs font-mono text-crimson-900/50">{assessment.recipientCode}</span>
                </div>
                <div className="flex items-center gap-2 ml-1">
                  {assessment.groupsCompatible ? (
                    <>
                      <CheckCircle2 className="text-emerald-600" size={18} />
                      <p className="font-semibold text-emerald-800 text-sm">Blood groups are compatible</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-600" size={18} />
                      <p className="font-semibold text-red-800 text-sm">Blood groups are NOT compatible</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Caution banner when no reports on file */}
            {assessment.needsCaution && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-5 bg-amber-50 border border-amber-200"
              >
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <ShieldAlert size={16} /> Caution Required
                </div>
                <ul className="mt-2 text-sm text-amber-800/90 list-disc list-inside">
                  <li>No approved test reports available for donor {assessment.donorCode}. Proceed only with medical supervision.</li>
                </ul>
              </motion.div>
            )}

            {/* AI Safety Assessment */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 bg-white border-2 ${
                assessment.safe ? "border-emerald-200" : "border-crimson-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg gradient-brand text-white flex items-center justify-center shrink-0">
                  <FlaskConical size={14} />
                </div>
                <h3 className="font-display font-semibold text-crimson-950">AI Safety Assessment</h3>
                <span className="ml-auto text-[11px] text-crimson-900/40 font-mono">
                  Verified against {assessment.reportsConsidered} report(s) for {assessment.donorCode}
                </span>
              </div>
              <p className="text-sm text-crimson-950/90 leading-relaxed">{assessment.headline}</p>
              <p className="bn text-sm text-crimson-900/70 leading-relaxed mt-2 text-right" dir="auto">
                {assessment.headlineBn}
              </p>

              {assessment.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-crimson-100">
                  <p className="text-xs font-bold text-crimson-700 uppercase tracking-wide mb-2">Recommendations:</p>
                  <ul className="space-y-1.5">
                    {assessment.recommendations.map((rec) => (
                      <li key={rec} className="flex items-start gap-2 text-sm text-crimson-900/80">
                        <ArrowRight size={13} className="mt-0.5 shrink-0 text-crimson-400" /> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-crimson-100 flex items-start gap-2 text-xs text-crimson-900/50">
                <Info size={13} className="shrink-0 mt-0.5" />
                <div>
                  <p>{assessment.disclaimerEn}</p>
                  <p className="bn mt-1" dir="auto">{assessment.disclaimerBn}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
