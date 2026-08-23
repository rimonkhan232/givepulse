import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, Trash2, Sparkles, Info } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, TEST_CATEGORIES, testCategoryOf } from "../lib/bloodUtils";
import PulseMark from "../components/PulseMark";

const RESULTS = ["Negative", "Positive", "Pending"];

export default function Reports() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onboarding = location.state?.onboarding;

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ testType: "HIV", result: "Negative", testDate: "", fileName: "", fileData: "", fileMime: "", notes: "" });
  const [fileError, setFileError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [readingFile, setReadingFile] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const loadReports = async () => {
    const { reports: rows } = await api.reports.mine();
    setReports(rows);
    return rows;
  };

  useEffect(() => {
    (async () => {
      await loadReports();
      setLoading(false);
    })();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await api.reports.myAnalysis();
      setAnalysis(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const isSpecificTest = form.testType !== "N/A";

  const handleUpload = async (e) => {
    e.preventDefault();
    if (isSpecificTest && !form.fileData) {
      setFileError("A report file is required when a specific test is selected.");
      return;
    }
    setFileError("");
    await api.reports.create(form);
    const rows = await loadReports();
    setForm({ testType: "HIV", result: "Negative", testDate: "", fileName: "", fileData: "", fileMime: "", notes: "" });
    setAnalysis(null);

    if (onboarding && rows.length > 0) {
      navigate(location.state?.from || "/dashboard", { replace: true });
    }
  };

  const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB -- keeps base64 payloads reasonable

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError("File is too large. Please choose one under 4MB.");
      return;
    }
    setFileError("");
    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // "data:<mime>;base64,<data>"
      const [, base64] = dataUrl.split(",");
      setForm((f) => ({ ...f, fileName: file.name, fileData: base64, fileMime: file.type }));
      setReadingFile(false);
    };
    reader.onerror = () => {
      setFileError("Couldn't read that file, please try again.");
      setReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.reports.remove(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setAnalysis(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewFile = async (report) => {
    setViewingId(report.id);
    try {
      const { fileMime, fileData } = await api.reports.file(report.id);
      const win = window.open();
      if (win) {
        if (fileMime === "application/pdf") {
          win.document.write(
            `<iframe src="data:application/pdf;base64,${fileData}" style="width:100%;height:100%;border:0"></iframe>`
          );
        } else {
          win.document.write(`<img src="data:${fileMime};base64,${fileData}" style="max-width:100%" />`);
        }
      }
    } finally {
      setViewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-crimson-950">Blood Test Reports</h1>
      <p className="text-sm text-crimson-900/50 mt-1">
        Upload your blood test reports so donors and seekers can verify safety before exchanging blood.
        You can add as many reports as you like, and remove any of them later.
      </p>

      {onboarding && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl"
        >
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Step 2 of 2 — this is the last step.</p>
            <p className="mt-1 text-amber-800/80">
              Upload at least one test report to unlock the rest of GivePulse. Need to change your
              details first? <Link to="/profile" className="font-semibold underline">Back to profile</Link>.
            </p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6 space-y-4">
        <div className="flex items-center gap-2 text-crimson-950 font-semibold">
          <Upload size={16} className="text-crimson-600" /> Add a Report
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-crimson-950">Test Type</label>
            <select
              value={form.testType}
              onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value }))}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
            >
              <option value="N/A">N/A — no specific test</option>
              {TEST_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.tests.map((t) => <option key={t}>{t}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {isSpecificTest && (
            <div>
              <label className="text-sm font-semibold text-crimson-950">Result</label>
              <select
                value={form.result}
                onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              >
                {RESULTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}
        </div>

        {!isSpecificTest && (
          <p className="text-xs text-crimson-900/40 bg-crimson-50 rounded-lg px-3 py-2">
            "N/A" just logs that you haven't uploaded a specific test yet — no date or file needed.
            Select an actual test above to add real proof (date, result, and a report file) so other
            users and the AI can verify it.
          </p>
        )}

        {isSpecificTest && (
          <>
            <div>
              <label className="text-sm font-semibold text-crimson-950">Test Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={form.testDate}
                onChange={(e) => setForm((f) => ({ ...f, testDate: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-crimson-950">
                Report File (image or PDF) <span className="text-red-500">*</span>
              </label>
              <label className={`mt-1.5 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed text-sm cursor-pointer hover:bg-crimson-50 transition-colors ${
                fileError ? "border-red-400" : "border-crimson-300"
              }`}>
                <span className="px-3 py-1 rounded-lg bg-crimson-100 text-crimson-700 font-medium text-xs">Choose file</span>
                <span className="text-crimson-900/40">
                  {readingFile ? "Reading file…" : form.fileName || "No file chosen"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {fileError && <p className="text-xs text-red-600 mt-1.5">{fileError}</p>}
              <p className="text-xs text-crimson-900/40 mt-1.5">
                This is required so the report can't just be typed in — it keeps the platform honest
                for everyone checking compatibility against it.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-semibold text-crimson-950">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Add Report
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-crimson-950 font-semibold">
            <FileText size={16} className="text-crimson-600" /> My Reports ({reports.length})
          </div>
          {reports.length > 0 && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="text-xs font-semibold text-crimson-700 bg-crimson-50 hover:bg-crimson-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={13} /> {analyzing ? "Analyzing…" : "Ask AI to analyze all reports"}
            </button>
          )}
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-crimson-900/40 text-center py-6">No reports added yet</p>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {reports.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-crimson-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-crimson-950">{r.testType}</p>
                    <p className="text-xs text-crimson-900/40">
                      {testCategoryOf(r.testType)} &middot; {formatDate(r.testDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.result === "Negative"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.result === "Positive"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.result === "Negative" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {r.result}
                    </span>
                    {r.fileName && (
                      <button
                        onClick={() => handleViewFile(r)}
                        disabled={viewingId === r.id}
                        title="View uploaded proof"
                        className="text-xs font-semibold text-crimson-700 hover:underline disabled:opacity-50"
                      >
                        {viewingId === r.id ? "Opening…" : "View file"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      title="Delete this report"
                      className="p-1.5 rounded-lg text-crimson-900/30 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-6 bg-white border-2 border-crimson-200 mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-brand text-white flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <h3 className="font-display font-semibold text-crimson-950">AI Report Analysis</h3>
            </div>
            <p className="text-sm text-crimson-950/90 leading-relaxed">{analysis.summaryEn}</p>
            <p className="bn text-sm text-crimson-900/70 leading-relaxed mt-2 text-right" dir="auto">
              {analysis.summaryBn}
            </p>
            {analysis.flags?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-crimson-100">
                <p className="text-xs font-bold text-crimson-700 uppercase tracking-wide mb-2">Flagged findings:</p>
                <ul className="space-y-1 text-sm text-crimson-900/80">
                  {analysis.flags.map((f, i) => (
                    <li key={i}>• {f.testType} ({f.category}) — {formatDate(f.testDate)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-crimson-100 flex items-start gap-2 text-xs text-crimson-900/50">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>{analysis.disclaimerEn}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
