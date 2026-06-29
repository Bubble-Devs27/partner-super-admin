"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"station-admin" | "super-admin">("station-admin");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      login(data.user);
      console.log("Logged-in user role is:", data.user?.role);
      if (data.user.role === "super-admin") {
        router.push("/super-dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "14px",
              marginBottom: "1rem",
              boxShadow: "0 8px 20px rgb(99 102 241 / 0.3)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.2" />
              <path
                d="M8 12C8 9.79 9.79 8 12 8s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"
                fill="white"
              />
              <path
                d="M4 12C4 7.58 7.58 4 12 4s8 3.58 8 8"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Create an account
          </h1>
          <p
            style={{
              color: "#64748b",
              marginTop: "0.375rem",
              fontSize: "0.9375rem",
            }}
          >
            Join BubbleX Partner today
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && (
              <div className="alert-error">
                <span>⚠ </span>{error}
              </div>
            )}

            <div>
              <label
                htmlFor="register-role"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Account Role
              </label>
              <select
                id="register-role"
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value as "station-admin" | "super-admin")}
                required
              >
                <option value="station-admin">Station Admin (Manage Services & Orders)</option>
                <option value="super-admin">Super Admin (System Administrator)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="register-username"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Username
              </label>
              <input
                id="register-username"
                type="text"
                className="input-field"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                minLength={3}
              />
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.375rem" }}>
                At least 3 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="register-password"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className="input-field"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.375rem" }}>
                At least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="register-confirm"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type="password"
                className="input-field"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ marginTop: "0.25rem" }}
            >
              {isLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <svg
                    style={{ animation: "spin 1s linear infinite" }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
              fontSize: "0.9rem",
              color: "#64748b",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#6366f1",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
