import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocateFixed, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { nearestDivision, saveDetectedDivision } from "../lib/geo";

const SESSION_KEY = "givepulse:locationPromptSeen";

// A one-time-per-session popup on the dashboard offering to detect the
// user's current GPS location and match it to the nearest division, so
// the "Near Me" tab on Blood Requests can use the real location instead
// of only whatever division was typed into the profile.
export default function LocationPrompt() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | locating | done | error
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  const detect = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { division, distanceKm } = nearestDivision(pos.coords.latitude, pos.coords.longitude);
        saveDetectedDivision(division);
        setResult({ division, distanceKm });
        setStatus("done");
        sessionStorage.setItem(SESSION_KEY, "1");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && status !== "locating" && dismiss()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full relative"
          >
            {status !== "locating" && (
              <button onClick={dismiss} className="absolute top-4 right-4 text-crimson-900/40 hover:text-crimson-700">
                <X size={18} />
              </button>
            )}

            <div className="w-12 h-12 rounded-full bg-crimson-50 text-crimson-600 flex items-center justify-center mb-4">
              <LocateFixed size={22} />
            </div>

            {status === "idle" && (
              <>
                <h3 className="font-display font-bold text-crimson-950 text-lg">
                  {lang === "bn" ? "আপনার লোকেশন শেয়ার করবেন?" : "Share your location?"}
                </h3>
                <p className="text-sm text-crimson-900/60 mt-2">
                  {lang === "bn"
                    ? "আপনার কাছাকাছি ব্লাড রিকোয়েস্ট খুঁজে বের করতে আমরা আপনার বর্তমান অবস্থান ব্যবহার করব। এটা শুধু আপনার ফোনেই সংরক্ষিত থাকবে।"
                    : "We'll use your current location to find blood requests near you. This stays only on your device."}
                </p>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-xl border border-crimson-200 text-crimson-700 font-semibold text-sm hover:bg-crimson-50 transition-colors"
                  >
                    {lang === "bn" ? "এখন না" : "Not now"}
                  </button>
                  <button
                    onClick={detect}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    {lang === "bn" ? "শেয়ার করুন" : "Share location"}
                  </button>
                </div>
              </>
            )}

            {status === "locating" && (
              <>
                <h3 className="font-display font-bold text-crimson-950 text-lg">
                  {lang === "bn" ? "অবস্থান শনাক্ত হচ্ছে…" : "Detecting your location…"}
                </h3>
                <p className="text-sm text-crimson-900/60 mt-2">
                  {lang === "bn" ? "আপনার ব্রাউজারে লোকেশন পারমিশন চেক করুন।" : "Check your browser for a permission prompt."}
                </p>
              </>
            )}

            {status === "done" && result && (
              <>
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle2 size={18} />
                  <h3 className="font-display font-bold text-crimson-950 text-lg">
                    {lang === "bn" ? "শনাক্ত হয়েছে" : "Location detected"}
                  </h3>
                </div>
                <p className="text-sm text-crimson-900/60 mt-1">
                  {lang === "bn"
                    ? `আপনার নিকটবর্তী বিভাগ: `
                    : `Your nearest division: `}
                  <span className="font-semibold text-crimson-950">{result.division}</span>
                  {" "}
                  {lang === "bn" ? `(~${result.distanceKm} কিমি)` : `(~${result.distanceKm} km away)`}
                </p>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-xl border border-crimson-200 text-crimson-700 font-semibold text-sm hover:bg-crimson-50 transition-colors"
                  >
                    {lang === "bn" ? "ঠিক আছে" : "Got it"}
                  </button>
                  <Link
                    to="/requests"
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm text-center hover:opacity-90 transition-opacity"
                  >
                    {lang === "bn" ? "Near Me দেখুন" : "View Near Me"}
                  </Link>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <AlertTriangle size={18} />
                  <h3 className="font-display font-bold text-crimson-950 text-lg">
                    {lang === "bn" ? "লোকেশন পাওয়া যায়নি" : "Couldn't get your location"}
                  </h3>
                </div>
                <p className="text-sm text-crimson-900/60 mt-1">
                  {lang === "bn"
                    ? "পারমিশন দেওয়া হয়নি বা ব্রাউজার সাপোর্ট করছে না। প্রোফাইলে সেভ করা বিভাগ অনুযায়ী Near Me কাজ করবে।"
                    : "Permission was denied or your browser doesn't support this. Near Me will keep using your saved profile division instead."}
                </p>
                <button
                  onClick={dismiss}
                  className="w-full mt-5 py-2.5 rounded-xl border border-crimson-200 text-crimson-700 font-semibold text-sm hover:bg-crimson-50 transition-colors"
                >
                  {lang === "bn" ? "ঠিক আছে" : "Got it"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
