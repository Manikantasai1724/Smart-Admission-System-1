import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Users,
  Loader,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function VolunteerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login, isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { username: "", password: "" },
  });

  // Redirect if already authenticated as correct role, otherwise logout
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "volunteer") {
        navigate("/volunteer/dashboard", { replace: true });
      } else {
        // They are logged in as HOD but trying to access volunteer login
        // Force logout so they can login as volunteer
        localStorage.removeItem("token");
        window.location.reload();
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setLoginError("");
    try {
      await login(data.username, data.password);
      addToast("success", "Welcome back! Login successful.");
    } catch (error) {
      const message =
        error.response?.data?.message || "Invalid username or password";
      setLoginError(message);
      addToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative">
      {/* Floating Orbs */}
      <div className="login-orb" />
      <div className="login-orb" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Role Selection</span>
        </button>

        {/* Card */}
        <div className="glass-card backdrop-blur-xl bg-white/40 dark:bg-primary-950/40 p-8 rounded-2xl shadow-xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <span>V</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Volunteer Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Admission Volunteer & Coordinator
            </p>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {loginError}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="volunteer_username"
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                  className="glass-input w-full pl-12 pr-4 py-3"
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 4,
                      message: "Password must be at least 4 characters",
                    },
                  })}
                  className="glass-input w-full pl-12 pr-12 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full glass-button py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Sign In as Volunteer
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-primary-400/10">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Smart Admission Tracking & Verification System
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 glass-card rounded-xl border border-emerald-200/50 dark:border-emerald-400/20 bg-emerald-50/30 dark:bg-emerald-900/20">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Volunteer Features:
            </span>{" "}
            Search students, update status, track progress
          </p>
        </div>
      </div>
    </div>
  );
}

export default VolunteerLoginPage;
