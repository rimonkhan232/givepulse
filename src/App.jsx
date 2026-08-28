import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireOnboarding from "./components/RequireOnboarding";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import DonorDetail from "./pages/DonorDetail";
import BloodBanks from "./pages/BloodBanks";
import BloodRequests from "./pages/BloodRequests";
import Compatibility from "./pages/Compatibility";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import DonationHistory from "./pages/DonationHistory";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDonors from "./pages/AdminDonors";
import AdminBloodBanks from "./pages/AdminBloodBanks";
import AdminRequests from "./pages/AdminRequests";
import AdminComplaints from "./pages/AdminComplaints";
import NotFound from "./pages/NotFound";

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <RequireOnboarding>
        <AppLayout>{children}</AppLayout>
      </RequireOnboarding>
    </ProtectedRoute>
  );
}

// Profile and Reports must stay reachable even when onboarding isn't
// complete yet — this is where the user completes it.
function OnboardingShell({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/donors" element={<Shell><Donors /></Shell>} />
            <Route path="/donors/:id" element={<Shell><DonorDetail /></Shell>} />
            <Route path="/blood-banks" element={<Shell><BloodBanks /></Shell>} />
            <Route path="/requests" element={<Shell><BloodRequests /></Shell>} />
            <Route path="/compatibility" element={<Shell><Compatibility /></Shell>} />
            <Route path="/messages" element={<Shell><Messages /></Shell>} />
            <Route path="/reports" element={<OnboardingShell><Reports /></OnboardingShell>} />
            <Route path="/history" element={<Shell><DonationHistory /></Shell>} />
            <Route path="/profile" element={<OnboardingShell><Profile /></OnboardingShell>} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/donors"
              element={
                <AdminRoute>
                  <AppLayout>
                    <AdminDonors />
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/blood-banks"
              element={
                <AdminRoute>
                  <AppLayout>
                    <AdminBloodBanks />
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <AdminRoute>
                  <AppLayout>
                    <AdminRequests />
                  </AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <AdminRoute>
                  <AppLayout>
                    <AdminComplaints />
                  </AppLayout>
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
