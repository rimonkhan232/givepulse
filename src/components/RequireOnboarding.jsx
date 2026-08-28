import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import PulseMark from "./PulseMark";

export function isProfileComplete(donor) {
  return Boolean(
    donor &&
      donor.fullName?.trim() &&
      donor.bloodGroup &&
      donor.division &&
      donor.phone?.trim() &&
      donor.address?.trim() &&
      donor.nid?.trim() &&
      donor.wants
  );
}

export default function RequireOnboarding({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const [{ donor }, { reports }] = await Promise.all([api.donors.me(), api.reports.mine()]);
        if (cancelled) return;
        const profileComplete = isProfileComplete(donor);
        const hasReport = reports.length > 0;
        setStatus({ profileComplete, hasReport, complete: profileComplete && hasReport });
      } catch {
        if (!cancelled) setStatus({ profileComplete: false, hasReport: false, complete: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return children;

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <PulseMark size={56} ring />
      </div>
    );
  }

  if (!status.complete) {
    return (
      <Navigate
        to={!status.profileComplete ? "/profile" : "/reports"}
        state={{ onboarding: true, from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
