import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, tint = "bg-crimson-600", delay = 0, theme = "brand" }) {
  const border = theme === "admin" ? "border-sky-100/60" : "border-crimson-100/60";
  const labelColor = theme === "admin" ? "text-sky-900/60" : "text-crimson-900/60";
  const valueColor = theme === "admin" ? "text-sky-950" : "text-crimson-950";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`glass card-lift rounded-2xl p-5 border ${border} shadow-sm flex items-center justify-between`}
    >
      <div>
        <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
        <p className={`text-2xl font-display font-semibold mt-1 ${valueColor}`}>{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl ${tint} text-white flex items-center justify-center shadow-md`}>
        {Icon && <Icon size={20} />}
      </div>
    </motion.div>
  );
}
