import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const result = await register({ fullName, email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // New accounts always land on the mandatory profile step first --
    // RequireOnboarding will route to /reports next until both are done.
    navigate("/profile", { state: { onboarding: true, from: "/dashboard" } });
  };

  return (
    <AuthLayout
      icon={<UserPlus className="text-white" size={24} />}
      title="Join GivePulse"
      subtitle="Create your account to save lives"
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-crimson-700 hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-crimson-950">Full name</label>
          <div className="mt-1.5 relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
        </div>
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
          <label className="text-sm font-semibold text-crimson-950">Password</label>
          <div className="mt-1.5 relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-crimson-950">Confirm password</label>
          <div className="mt-1.5 relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-crimson-400" />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-crimson-200 focus-ring bg-white/80 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-crimson-700 bg-crimson-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
