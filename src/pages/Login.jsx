import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, User, ShieldCheck, Mail, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [panel, setPanel] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (panel === "admin" && result.user.role !== "admin") {
      setError("This account doesn't have admin access.");
      return;
    }
    navigate(from || (result.user.role === "admin" ? "/admin" : "/dashboard"));
  };

  return (
    <AuthLayout
      icon={<Heart className="text-white fill-white" size={26} />}
      title={`Welcome to ${t("appName")}`}
      subtitle="Choose how you want to sign in"
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-crimson-700 hover:underline">
            Create one
          </Link>
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setPanel("user")}
          className={`text-left p-4 rounded-2xl border-2 transition-all ${
            panel === "user" ? "border-crimson-600 bg-crimson-50" : "border-crimson-100 hover:border-crimson-200"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-crimson-100 text-crimson-700 flex items-center justify-center mb-2">
            <User size={16} />
          </div>
          <p className="text-sm font-semibold text-crimson-950">User Panel</p>
          <p className="text-xs text-crimson-900/50">Donate or find blood</p>
        </button>
        <button
          type="button"
          onClick={() => setPanel("admin")}
          className={`text-left p-4 rounded-2xl border-2 transition-all ${
            panel === "admin" ? "border-sky-500 bg-sky-50" : "border-crimson-100 hover:border-sky-200"
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
            panel === "admin" ? "bg-sky-100 text-sky-700" : "bg-crimson-100 text-crimson-700"
          }`}>
            <ShieldCheck size={16} />
          </div>
          <p className="text-sm font-semibold text-crimson-950">Admin Panel</p>
          <p className="text-xs text-crimson-900/50">Manage the platform</p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-crimson-950">Email</label>
          <div className="mt-1.5 relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-crimson-950">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-crimson-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="mt-1.5 relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-crimson-700 bg-crimson-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-60 ${
            panel === "admin" ? "gradient-admin" : "gradient-brand"
          }`}
        >
          <Heart size={16} className="fill-white" /> {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
