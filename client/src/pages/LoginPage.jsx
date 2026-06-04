import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { User, Lock, Eye, EyeOff, GraduationCap, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function LoginPage() {
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

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(
        user.role === "hod" ? "/hod/dashboard" : "/volunteer/dashboard",
        { replace: true },
      );
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
      <div className="login-orb" />
      <div className="login-orb" />

      {/* Floating geometric shapes */}
      <div
        className="absolute top-20 left-20 w-20 h-20 border border-white/10 rounded-2xl rotate-12 animate-float hidden lg:block"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute bottom-32 right-24 w-16 h-16 border border-white/10 rounded-full animate-float hidden lg:block"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-12 h-12 border border-white/10 rounded-lg rotate-45 animate-float hidden lg:block"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-white/5 rounded-full animate-float hidden lg:block"
        style={{ animationDelay: "1s" }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/20 p-8 sm:p-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-xl shadow-primary-500/30 mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Admit<span className="text-primary-300">Track</span>
            </h1>
            <p className="text-sm text-white/60">
              EAPCET Admission Tracking System
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
              <p className="text-sm text-red-300 text-center">{loginError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
                <input
                  type="text"
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                  placeholder="Enter your username"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 pl-12 text-white placeholder-white/30 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 backdrop-blur-sm"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 4,
                      message: "Password must be at least 4 characters",
                    },
                  })}
                  placeholder="Enter your password"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 pl-12 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-400/30 focus:ring-offset-0"
                />
                <span className="text-sm text-white/60">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl px-6 py-3.5 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/30">
              Smart Admission Tracking & Verification System
            </p>
            <p className="text-xs text-white/20 mt-1">
              © 2026 All rights reserved
            </p>
          </div>
        </div>

        {/* Decorative glow under card */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary-500/20 blur-3xl rounded-full" />
      </div>
    </div>
  );
}

export default LoginPage;
