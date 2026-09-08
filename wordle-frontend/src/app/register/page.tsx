"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!form.username.trim()) return "Username is required.";
    if (form.username.trim().length < 3)
      return "Username must be at least 3 characters.";
    if (form.username.trim().length > 30)
      return "Username must be at most 30 characters.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.email.includes("@")) return "Please enter a valid email.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/login");
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
          <div className="flex items-center justify-center gap-1.5 -mt-1">
            <h2 className="font-display font-black text-5xl text-primary tracking-tight">
              ARENA
            </h2>
          </div>
          <p className="font-body text-text-secondary mt-2">
            Create your account
          </p>
        </div>

        {/* Register Card */}
        <div className="card-brutal p-8">
          <h3 className="font-display font-bold text-2xl mb-6">Sign Up</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block font-display font-semibold text-sm mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="w-full px-4 py-2.5 border-3 border-border rounded-sm font-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Choose a username (3-30 chars)"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-display font-semibold text-sm mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full px-4 py-2.5 border-3 border-border rounded-sm font-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-4 py-2.5 border-3 border-border rounded-sm font-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="At least 8 characters"
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
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-6 font-body text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-display font-bold text-border underline underline-offset-2 hover:text-primary"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
