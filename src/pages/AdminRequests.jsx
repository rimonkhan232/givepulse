import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { requests: rows } = await api.requests.list();
      setRequests(rows);
      setLoading(false);
    })();
  }, []);

  const markFulfilled = async (r) => {
    const nextStatus = r.status === "fulfilled" ? "open" : "fulfilled";
    await api.requests.update(r.id, { status: nextStatus });
    setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: nextStatus } : x)));
  };

  const removeRequest = async (r) => {
    if (!window.confirm("Delete this blood request?")) return;
    await api.requests.remove(r.id);
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
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
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-sky-950">Blood Requests</h1>
        <p className="text-sm text-sky-900/50 mt-1">{requests.length} request(s) from finders across the platform</p>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-sky-900/40 text-center py-16 bg-white rounded-2xl border border-sky-100">
          No blood requests have been posted yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {requests.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`bg-white rounded-2xl border p-5 relative ${
                  r.status === "fulfilled" ? "border-emerald-200 opacity-70" : "border-sky-100"
                }`}
              >
                {r.status === "fulfilled" && (
                  <span className="absolute top-5 right-5 text-[11px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                    Fulfilled
                  </span>
                )}
                {r.status !== "fulfilled" && r.urgency === "Urgent" && (
                  <span className="absolute top-5 right-5 text-[11px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    Urgent
                  </span>
                )}
                <BloodGroupBadge group={r.bloodGroup} theme="admin" />
                <p className="mt-3 text-sm font-semibold text-sky-950">{r.units} unit(s)</p>
                <p className="text-sm text-sky-900/60 flex items-center gap-1.5 mt-2">
                  <MapPin size={13} /> {r.location}
                </p>
                <p className="text-sm text-sky-900/60 flex items-center gap-1.5 mt-1">
                  <Clock size={13} /> {formatDate(r.createdAt)}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100">
                  <span className="text-xs font-semibold text-sky-800">{r.requesterName}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => markFulfilled(r)}
                      className="p-2 rounded-lg text-sky-900/40 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title={r.status === "fulfilled" ? "Mark as open" : "Mark as fulfilled"}
                    >
                      <CheckCircle2 size={15} />
                    </button>
                    <button
                      onClick={() => removeRequest(r)}
                      className="p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete request"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
