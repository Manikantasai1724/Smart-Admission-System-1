import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Lazy load pages for maximum performance and minimum bundle size
const LandingPage = lazy(() => import("./pages/LandingPage"));
const HodLoginPage = lazy(() => import("./pages/HodLoginPage"));
const VolunteerLoginPage = lazy(() => import("./pages/VolunteerLoginPage"));
const HodDashboard = lazy(() => import("./pages/HodDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><LoadingSpinner message="Loading..." /></div>}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/login/hod" element={<HodLoginPage />} />
                <Route path="/login/volunteer" element={<VolunteerLoginPage />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["hod"]}>
                      <HodDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/volunteer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["volunteer"]}>
                      <VolunteerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "hod"]}>
                      <StudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students/:id"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "hod", "volunteer"]}>
                      <StudentDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
