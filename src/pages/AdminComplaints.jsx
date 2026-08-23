import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, ShieldOff, Trash2, CheckCircle2, XCircle, ImageIcon, Hash } from "lucide-react";
import { api } from "../lib/api";
import { formatDate } from "../lib/bloodUtils";
import PulseMark from "../components/PulseMark";

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "dismissed", label: "Dismissed" },
];

export default function AdminComplaints() {
  const [tab, setTab] = useState("pending");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const load = async (status) => {
    setLoading(true);
    const { complaints: rows } = await api.complaints.list({ status });
    setComplaints(rows);
    setLoading(false);
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const dismiss = async (id) => {
    setBusyId(id);
    try {
      await api.complaints.update(id, { status: "dismissed" });
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const blacklist = async (complaint) => {
    if (!window.confirm(`Blacklist ${complaint.donorName} (${complaint.donorCode})? They'll be hidden from the donor directory.`)) return;
    setBusyId(complaint.id);
    try {
      await api.complaints.blacklist(complaint.id);
      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
    } finally {
      setBusyId(null);
    }
  };

  const deleteAccount = async (complaint) => {
    if (!window.confirm(`Permanently delete ${complaint.donorName}'s account? This cannot be undone.`)) return;
    setBusyId(complaint.id);
    try {
      await api.admin.deleteDonorAccount(complaint.donorId);
      await api.complaints.update(complaint.id, { status: "reviewed" });
      setComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
    } finally {
      setBusyId(null);
    }
  };

  const viewProof = async (complaint) => {
    setViewingId(complaint.id);
    try {
      const { imageMime, imageData } = await api.complaints.image(complaint.id);
      const win = window.open();
      if (win) {
        win.document.write(`<img src="data:${imageMime || "image/jpeg"};base64,${imageData}" style="max-width:100%" />`);
      }
    } finally {
      setViewingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-sky-950 flex items-center gap-2">
          <Flag size={22} className="text-sky-600" /> Complaints
        </h1>
        <p className="text-sm text-sky-900/50 mt-1">
          Reports filed by blood finders against donors. Only admins can see these.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === s.key ? "gradient-admin text-white" : "bg-white text-sky-900/60 border border-sky-100 hover:bg-sky-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><PulseMark size={44} ring /></div>
      ) : complaints.length === 0 ? (
        <p className="text-sm text-sky-900/40 text-center py-16 bg-white rounded-2xl border border-sky-100">
          No {tab} complaints.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          <AnimatePresence>
            {complaints.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-sky-100 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-sky-950">{c.donorName}</p>
                    <p className="text-xs text-sky-900/40 font-mono flex items-center gap-1 mt-0.5">
                      <Hash size={10} /> {c.donorCode} {c.donorNid && `· NID ${c.donorNid}`}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide bg-red-50 text-red-600 px-2.5 py-1 rounded-full shrink-0">
                    {c.type}
                  </span>
                </div>

                {c.description && (
                  <p className="text-sm text-sky-900/70 mt-3 leading-relaxed">{c.description}</p>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs text-sky-900/40">
                  <ImageIcon size={12} /> Proof: {c.imageName}
                  {c.hasImage && (
                    <button
                      onClick={() => viewProof(c)}
                      disabled={viewingId === c.id}
                      className="text-sky-700 font-semibold hover:underline disabled:opacity-50"
                    >
                      {viewingId === c.id ? "Opening…" : "View"}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-sky-100">
                  <div>
                    <p className="text-xs text-sky-900/40">Filed by {c.complainantName}</p>
                    <p className="text-xs text-sky-900/30">{formatDate(c.createdAt)}</p>
                  </div>
                  {tab === "pending" && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => dismiss(c.id)}
                        disabled={busyId === c.id}
                        title="Dismiss (not a valid complaint)"
                        className="p-2 rounded-lg text-sky-900/40 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        <XCircle size={16} />
                      </button>
                      <button
                        onClick={() => blacklist(c)}
                        disabled={busyId === c.id}
                        title="Blacklist this donor"
                        className="p-2 rounded-lg text-sky-900/40 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                      >
                        <ShieldOff size={16} />
                      </button>
                      <button
                        onClick={() => deleteAccount(c)}
                        disabled={busyId === c.id}
                        title="Delete donor's account"
                        className="p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {tab === "reviewed" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={13} /> Resolved
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
