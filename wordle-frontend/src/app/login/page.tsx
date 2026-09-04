"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login as loginApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.usernameOrEmail.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await loginApi({
        usernameOrEmail: form.usernameOrEmail.trim(),
        password: form.password,
      });
      loginStore(response);
      router.push("/");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to connect to Wordle Arena.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-5xl text-border tracking-tight">
            WORDLE
          </h1>
          <h2 className="font-display font-black text-5xl text-primary tracking-tight -mt-1">
            ARENA
          </h2>
          <p className="font-body text-text-secondary mt-2">
            Competitive word games await
          </p>
        </div>

        {/* Login Card */}
        <div className="card-brutal p-8">
          <h3 className="font-display font-bold text-2xl mb-6">Sign In</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="usernameOrEmail"
                className="block font-display font-semibold text-sm mb-1.5"
              >
                Username or Email
              </label>
              <input
                id="usernameOrEmail"
                type="text"
                autoComplete="username"
                value={form.usernameOrEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, usernameOrEmail: e.target.value }))
                }
                className="w-full px-4 py-2.5 border-3 border-border rounded-sm font-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter username or email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-display font-semibold text-sm mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-4 py-2.5 border-3 border-border rounded-sm font-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-pastel-pink border-2 border-danger rounded-sm px-4 py-2.5 text-sm font-body text-danger"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brutal w-full bg-primary text-border py-3 text-base font-display font-bold"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 font-body text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-display font-bold text-border underline underline-offset-2 hover:text-primary"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
