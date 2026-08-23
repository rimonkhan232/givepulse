import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Users, Droplet, Activity, MessageSquare, FileText,
  CalendarClock, UserCircle, ShieldCheck, LogOut, Menu, FlaskConical, Flag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PulseMark from "./PulseMark";
import LanguageToggle from "./LanguageToggle";

const userNav = [
  { to: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { to: "/donors", label: "donors", icon: Users },
  { to: "/blood-banks", label: "bloodBanks", icon: Droplet },
  { to: "/requests", label: "requests", icon: Activity },
  { to: "/compatibility", label: "compatibility", icon: FlaskConical },
  { to: "/messages", label: "messages", icon: MessageSquare },
  { to: "/reports", label: "myReports", icon: FileText },
  { to: "/history", label: "history", icon: CalendarClock },
  { to: "/profile", label: "profile", icon: UserCircle },
];

const adminNav = [
  { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { to: "/admin/donors", label: "Donors", icon: Users },
  { to: "/admin/blood-banks", label: "Blood Banks", icon: Droplet },
  { to: "/admin/requests", label: "Blood Requests", icon: Activity },
  { to: "/admin/complaints", label: "Complaints", icon: Flag },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const gradientClass = isAdmin ? "gradient-admin" : "gradient-brand";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-3 px-6 py-6 cursor-pointer"
        onClick={() => navigate(isAdmin ? "/admin" : "/")}
      >
        <PulseMark size={38} tone={isAdmin ? "sky" : "crimson"} />
        <div>
          <span className="text-xl font-display font-bold tracking-tight text-white">
            {t("appName")}
          </span>
          {isAdmin && (
            <div className="text-[10px] tracking-widest uppercase text-white/70 -mt-0.5">
              Admin
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {(isAdmin ? adminNav : userNav).map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/20 text-white shadow-inner"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`
            }
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <item.icon size={18} className="shrink-0" />
            <span>{isAdmin ? item.label : t(item.label)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex ${isAdmin ? "bg-sky-50" : "bg-sand"}`}>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex lg:flex-col w-64 shrink-0 ${gradientClass} relative overflow-hidden`}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 animate-drift" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 rounded-full bg-white/5 animate-drift" style={{ animationDelay: "2s" }} />
        <div className="relative z-10 h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className={`fixed inset-y-0 left-0 w-72 ${gradientClass} z-50 lg:hidden`}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className={`h-16 shrink-0 flex items-center justify-between px-4 sm:px-8 backdrop-blur border-b sticky top-0 z-30 ${
            isAdmin ? "bg-white/70 border-sky-100" : "bg-white/70 border-crimson-100/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              className={`lg:hidden p-2 rounded-lg ${isAdmin ? "hover:bg-sky-50 text-sky-700" : "hover:bg-crimson-50 text-crimson-700"}`}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <p className={`text-sm ${isAdmin ? "text-sky-900/60" : "text-crimson-900/60"}`}>
              {t("welcome")}, <span className={`font-semibold ${isAdmin ? "text-sky-700" : "text-crimson-700"}`}>{user?.fullName}</span>
            </p>
          </div>
          <LanguageToggle admin={isAdmin} />
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 p-4 sm:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
