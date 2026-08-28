import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Droplet, Users, ArrowRight, ShieldCheck,
  FlaskConical, Languages, Radio, HeartPulse,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import PulseMark from "../components/PulseMark";
import LanguageToggle from "../components/LanguageToggle";
import BloodGroupBadge from "../components/BloodGroupBadge";

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const step = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Stat({ value, suffix = "", label }) {
  const n = useCountUp(value);
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-display font-bold text-white">
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="text-white/70 text-sm mt-1">{label}</p>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [stats, setStats] = useState({ donorTotal: 0, bankTotal: 0, activeDonors: 0, districts: 0 });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ donors, total: donorTotal }, { bloodBanks, total: bankTotal }, { requests: openRequests }] =
        await Promise.all([
          api.donors.list({ limit: 500 }),
          api.bloodBanks.list({ limit: 500 }),
          api.requests.list({ status: "open", limit: 3 }),
        ]);
      const activeDonors = donors.filter((d) => d.available).length;
      const districts = new Set([...bloodBanks.map((b) => b.division), ...donors.map((d) => d.division)]).size;
      setStats({ donorTotal, bankTotal, activeDonors, districts });
      setRequests(openRequests);
    })();
  }, []);

  const steps = [
    { title: t("step1Title"), body: t("step1Body"), icon: UsersIconWrap },
    { title: t("step2Title"), body: t("step2Body"), icon: Radio },
    { title: t("step3Title"), body: t("step3Body"), icon: HeartPulse },
  ];

  const features = [
    { title: t("feat1"), body: t("feat1body"), icon: Droplet },
    { title: t("feat2"), body: t("feat2body"), icon: FlaskConical },
    { title: t("feat3"), body: t("feat3body"), icon: ShieldCheck },
    { title: t("feat4"), body: t("feat4body"), icon: Languages },
  ];

  return (
    <div className="min-h-screen bg-sand overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 gradient-brand shadow-lg shadow-crimson-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-3">
              <PulseMark size={38} />
              <span className="text-xl font-display font-bold text-white tracking-tight">
                {t("appName")}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle dark />
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-full bg-white text-crimson-700 text-sm font-semibold hover:bg-crimson-50 transition-colors"
                >
                  {t("dashboard")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full bg-white text-crimson-700 text-sm font-semibold hover:bg-crimson-50 transition-colors"
                >
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative gradient-brand pb-28 pt-16 sm:pt-24 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 animate-drift" />
        <div className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-white/5 animate-drift" style={{ animationDelay: "3s" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wide uppercase">
                <PulseMark size={18} /> {t("tagline")}
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.08]">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 text-white/80 text-lg max-w-xl">{t("heroSub")}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={user ? "/donors" : "/register"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-crimson-700 font-semibold hover:bg-crimson-50 transition-all hover:-translate-y-0.5 shadow-lg shadow-black/10"
                >
                  {t("findDonors")} <ArrowRight size={18} />
                </Link>
                <Link
                  to={user ? "/profile" : "/register"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/30 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  {t("becomeDonor")}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              className="relative"
            >
              <div className="glass rounded-3xl p-6 shadow-2xl shadow-black/20 border border-white/40">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-crimson-950">{t("urgentRequests")}</p>
                  <span className="w-2.5 h-2.5 rounded-full bg-pulse animate-pulsering" />
                </div>
                <div className="space-y-3">
                  {requests.length === 0 && (
                    <p className="text-sm text-crimson-900/50 py-8 text-center">No open requests right now.</p>
                  )}
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-crimson-100 card-lift"
                    >
                      <BloodGroupBadge group={r.bloodGroup} size="sm" pulse />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-crimson-950 truncate">{r.location}</p>
                        <p className="text-xs text-crimson-900/50">{r.units} unit(s) &middot; {r.urgency}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/requests"
                  className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-crimson-700 hover:text-crimson-800"
                >
                  {t("viewAll")} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 pt-10 border-t border-white/10">
            <Stat value={stats.donorTotal} label={t("livesTouched")} />
            <Stat value={stats.activeDonors} label={t("activeDonors")} />
            <Stat value={stats.bankTotal} label={t("bloodBanks")} />
            <Stat value={stats.districts} label={t("citiesCovered")} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-display font-bold text-center text-crimson-950"
        >
          {t("howItWorks")}
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative rounded-3xl bg-white p-8 border border-crimson-100 card-lift"
            >
              <div className="w-12 h-12 rounded-2xl gradient-brand text-white flex items-center justify-center mb-5">
                <s.icon size={22} />
              </div>
              <p className="text-xs font-bold text-crimson-500 tracking-widest">STEP {i + 1}</p>
              <h3 className="text-lg font-display font-semibold text-crimson-950 mt-1">{s.title}</h3>
              <p className="text-sm text-crimson-900/60 mt-2 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24 border-y border-crimson-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-display font-bold text-center text-crimson-950 max-w-2xl mx-auto"
          >
            {t("whyTitle")}
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-sand border border-crimson-100 card-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-crimson-600 text-white flex items-center justify-center mb-4">
                  <f.icon size={18} />
                </div>
                <h3 className="font-display font-semibold text-crimson-950">{f.title}</h3>
                <p className="text-sm text-crimson-900/60 mt-2 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative gradient-brand py-24 overflow-hidden">
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-white/5 animate-drift" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <PulseMark size={56} ring />
            <h2 className="mt-6 text-3xl sm:text-4xl font-display font-bold text-white">{t("ctaTitle")}</h2>
            <p className="mt-3 text-white/80">{t("ctaBody")}</p>
            <Link
              to={user ? "/donors" : "/register"}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-crimson-700 font-semibold hover:bg-crimson-50 transition-all hover:-translate-y-0.5 shadow-lg"
            >
              {t("joinNow")} <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-crimson-950 text-white/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PulseMark size={28} />
            <span className="font-display font-semibold text-white">{t("appName")}</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} {t("appName")}. {t("footerRights")}</p>
        </div>
      </footer>
    </div>
  );
}

function UsersIconWrap(props) {
  return <Users {...props} />;
}
