import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PulseMark from "./PulseMark";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <PulseMark size={56} ring />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
