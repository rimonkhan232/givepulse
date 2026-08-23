import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    const result = await resetPassword({ email, newPassword: password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setDone(true);
    setTimeout(() => navigate("/login"), 1400);
  };

  return (
    <AuthLayout
      icon={<ShieldCheck className="text-white" size={22} />}
      title="Set a new password"
      subtitle="Choose something you'll remember"
      footer={
        <span>
          <Link to="/login" className="font-semibold text-crimson-700 hover:underline">
            Back to log in
          </Link>
        </span>
      }
    >
      {done ? (
        <p className="text-center text-sm text-crimson-900/70 py-6">
          Password updated — redirecting to log in…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-crimson-950">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-crimson-950">New password</label>
            <div className="mt-1.5 relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-crimson-950">Confirm new password</label>
            <div className="mt-1.5 relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-crimson-700 bg-crimson-50 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-95 transition-opacity"
          >
            Update password
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
