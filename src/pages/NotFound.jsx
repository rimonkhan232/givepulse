import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PulseMark from "../components/PulseMark";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PulseMark size={56} ring />
      </motion.div>
      <h1 className="mt-6 text-3xl font-display font-bold text-crimson-950">Page not found</h1>
      <p className="text-crimson-900/50 mt-2">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Back to home
      </Link>
    </div>
  );
}
