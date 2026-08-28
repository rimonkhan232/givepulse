import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle({ dark = false, admin = false }) {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors focus-ring ${
        dark
          ? "bg-white/15 text-white hover:bg-white/25"
          : admin
          ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
          : "bg-crimson-50 text-crimson-700 hover:bg-crimson-100"
      }`}
    >
      <Languages size={14} />
      <span className="bn">{lang === "en" ? "বাংলা" : "English"}</span>
    </button>
  );
}
