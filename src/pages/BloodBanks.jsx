import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Phone, Droplet, Clock, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { BLOOD_GROUPS } from "../lib/bloodUtils";
import { useLanguage } from "../context/LanguageContext";
import PulseMark from "../components/PulseMark";

function stockTint(count) {
  if (count === 0) return "bg-gray-50 text-gray-400";
  if (count < 10) return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function timeLeftLabel(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Releasing…";
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function BloodBanks() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myReservations, setMyReservations] = useState([]);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);

  const loadBanks = async (q) => {
    const { bloodBanks } = await api.bloodBanks.list({ q: q || undefined, limit: 200 });
    setBanks(bloodBanks);
  };

  const loadReservations = async () => {
    const { reservations } = await api.bloodBanks.myReservations();
    setMyReservations(
      reservations
        .filter((r) => r.status === "active")
        .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))
    );
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadBanks(), loadReservations()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadBanks(query), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Live-refresh every 30s so countdowns tick and expired holds get released
  // server-side (the backend sweeps expirations every minute automatically).
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((n) => n + 1);
      loadReservations();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filtered = useMemo(() => banks, [banks]);

  const handleReserve = async (bank, group) => {
    try {
      await api.bloodBanks.reserve(bank.id, group);
      setToast(`Reserved 1 unit of ${group} at ${bank.name} for 3 hours.`);
      await Promise.all([loadBanks(query), loadReservations()]);
    } catch (err) {
      setToast(err.message);
    }
  };

  const handleRelease = async (reservationId) => {
    await api.bloodBanks.release(reservationId);
    await Promise.all([loadBanks(query), loadReservations()]);
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
      <h1 className="text-2xl font-display font-bold text-crimson-950">{t("bloodBanks")} Availability</h1>
      <p className="text-sm text-crimson-900/50 mt-1">
        Live unit counts across partner blood banks. Reserve a unit and it's held for you for 3 hours.
      </p>

      {myReservations.length > 0 && (
        <div className="bg-white rounded-2xl border border-crimson-100 p-5 mt-6">
          <h2 className="font-display font-semibold text-crimson-950 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-crimson-600" /> My Active Reservations
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {myReservations.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-crimson-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl gradient-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {r.blood_group}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-crimson-950 truncate">{r.bank_name}</p>
                      <p className="text-xs text-crimson-900/50">{timeLeftLabel(r.expires_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRelease(r.id)}
                    className="text-xs font-semibold text-crimson-700 hover:underline shrink-0"
                  >
                    Release now
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-crimson-100 p-4 mt-6 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crimson-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blood banks..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-crimson-200 focus-ring text-sm"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {filtered.map((bank, i) => {
          const total = Object.values(bank.stock).reduce((a, b) => a + b, 0);
          return (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-white rounded-2xl border border-crimson-100 p-6 card-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-crimson-950">{bank.name}</h3>
                  <p className="text-xs text-crimson-900/50 flex items-center gap-1 mt-1">
                    <MapPin size={11} /> {bank.address}
                  </p>
                  <p className="text-xs text-crimson-900/50 flex items-center gap-1 mt-1">
                    <Phone size={11} /> {bank.phone}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-crimson-600 text-white flex items-center justify-center">
                    <Droplet size={16} />
                  </div>
                  <p className="text-[11px] text-crimson-900/40 mt-1">{total} units total</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-5">
                {BLOOD_GROUPS.map((g) => {
                  const count = bank.stock[g];
                  return (
                    <div key={g} className={`rounded-xl py-2.5 text-center relative group ${stockTint(count)}`}>
                      <p className="text-xs font-bold">{g}</p>
                      <p className="text-sm font-semibold">{count}</p>
                      {count > 0 && (
                        <button
                          onClick={() => handleReserve(bank, g)}
                          className="mt-1 w-full text-[10px] font-semibold uppercase tracking-wide text-crimson-700 hover:text-crimson-900 hover:underline"
                        >
                          Reserve
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-crimson-950 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
