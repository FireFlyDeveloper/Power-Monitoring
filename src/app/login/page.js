"use client";

import React, { useState } from "react";
import "../globals.css";
import { useAuth } from "../../utils/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://power-monitoring-backend.onrender.com/auth/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Login failed. Please check your credentials.");
        return;
      }

      const data = await response.json();
      
      const success = await signIn({ token: data.token, authUserState: data.authUserState });
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred while trying to log in. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-cyan-400/5 float"></div>
        <div
          className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-emerald-400/5 float"
          style={{ animationDelay: "-2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-teal-400/5 float"
          style={{ animationDelay: "-4s" }}
        ></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4 energy-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
                stroke="currentColor"
                className="text-cyan-300"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Green Energy Monitor
          </h1>
          <p className="mt-2 text-teal-100/70">
            Sign in to access your energy dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-6 md:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center">
              <svg 
                className="w-5 h-5 mr-2 flex-shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-teal-100/80 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(""); // Clear error when user starts typing
                  }}
                  className={`form-input w-full px-4 py-3 rounded-xl text-teal-50 placeholder-teal-100/40 ${
                    error ? "border border-red-500/50" : ""
                  }`}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-teal-100/40"
                  >
                    <path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-teal-100/80 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(""); // Clear error when user starts typing
                  }}
                  className={`form-input w-full px-4 py-3 rounded-xl text-teal-50 placeholder-teal-100/40 ${
                    error ? "border border-red-500/50" : ""
                  }`}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-teal-100/40 hover:text-teal-100/70"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn btn-primary w-full py-3 px-4 rounded-xl text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}