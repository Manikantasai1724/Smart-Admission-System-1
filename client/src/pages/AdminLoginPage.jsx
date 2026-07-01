import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function AdminLoginPage() {
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
      if (user.role.toLowerCase() === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
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
      addToast("success", "Welcome back, Admin!");
    } catch (error) {
      const message =
        error.response?.data?.message || "Invalid username or password";
      setLoginError(message);
      addToast("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setLoginError("");
    try {
      await login("admin", "admin123");
      addToast("success", "Welcome back, Admin!");
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
      <div className="login-orb" />
      <div className="login-orb" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="glass-card backdrop-blur-xl bg-white/40 dark:bg-primary-950/40 p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-purple-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              User Management Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {loginError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="admin"
                  {...register("username", {
                    required: "Username is required",
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="admin@123"
                  {...register("password", {
                    required: "Password is required",
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Enter System
                </>
              )}
            </button>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700/50"></div>
              <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700/50"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Quick Login (admin / admin123)
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
