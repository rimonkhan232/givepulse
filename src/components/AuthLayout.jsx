import { motion } from "framer-motion";
import PulseMark from "./PulseMark";
import LanguageToggle from "./LanguageToggle";

export default function AuthLayout({ icon, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-sand relative overflow-hidden flex flex-col">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-crimson-200/40 animate-drift" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-crimson-200/40 animate-drift" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 flex justify-end p-5">
        <LanguageToggle />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-crimson-900/20">
            {icon}
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-display font-bold text-crimson-950 text-center">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-crimson-900/60 mt-1 text-center">{subtitle}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md glass rounded-3xl p-8 shadow-xl shadow-crimson-900/10 border border-white/60"
        >
          {children}
        </motion.div>

        {footer && <div className="mt-6 text-sm text-crimson-900/70">{footer}</div>}
      </div>
    </div>
  );
}
