"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { register } from "@/lib/api"
import Image from "next/image"
import AppLogo from "@/components/AppLogo"

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agree, setAgree] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false
    return password !== confirmPassword
  }, [password, confirmPassword])

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      !passwordMismatch &&
      agree &&
      !loading
    )
  }, [fullName, email, password, confirmPassword, passwordMismatch, agree, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!agree) {
      setError("You must accept the Terms to continue.")
      return
    }
    if (passwordMismatch) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)

      // Ton backend actuel ne prend que email/password
      // fullName est UX-only pour le moment (tu pourras l’ajouter plus tard au schéma backend)
      await register(email, password)

      router.push("/auth/login")
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* LEFT PANEL */}
<section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 p-10 text-white shadow-xl min-h-[720px] flex items-center">
  <div className="absolute inset-0 opacity-40 [background:radial-gradient(800px_circle_at_20%_20%,rgba(59,130,246,0.35),transparent_40%),radial-gradient(700px_circle_at_80%_70%,rgba(168,85,247,0.30),transparent_45%)]" />
  
  <div className="relative w-full max-w-md mx-auto">
    <h2 className="text-5xl font-bold tracking-normal leading-normal">
      Join VM Marketplace
    </h2>

    <p className="mt-5 text-lg leading-8 text-slate-200">
      Create an account to deploy virtual machines, manage resources, and
      scale your infrastructure.
    </p>

    <div className="mt-10 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <ul className="space-y-6">
        <li className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30">
            ✓
          </span>
          <div>
            <p className="text-xl font-medium">Thousands of pre-configured VMs</p>
            <p className="mt-1 text-base text-slate-300">
              Choose from a wide selection of optimized images
            </p>
          </div>
        </li>

        <li className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
            ✓
          </span>
          <div>
            <p className="text-xl font-medium">Pay only for what you use</p>
            <p className="mt-1 text-base text-slate-300">
              Transparent pricing with no hidden fees
            </p>
          </div>
        </li>

        <li className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30">
            ✓
          </span>
          <div>
            <p className="text-xl font-medium">Global infrastructure</p>
            <p className="mt-1 text-base text-slate-300">
              Deploy in multiple regions around the world
            </p>
          </div>
        </li>
      </ul>
    </div>

    <div className="mt-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/10">
      <span className="text-sm font-medium text-white">N</span>
    </div>
  </div>
</section>

          {/* RIGHT PANEL */}
          <section className="flex flex-col">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <span aria-hidden>←</span> Back to Home
              </Link>

              <div className="flex items-center gap-2">
                <AppLogo />
                <span className="text-2xl font-bold text-slate-900">VM Marketplace</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h1 className="text-2xl font-medium text-slate-900">
                Create an Account
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Enter your information to create an account
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="mt-2">
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="mt-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Minimum 6 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <div className="mt-2">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={[
                        "w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4",
                        passwordMismatch
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-100",
                      ].join(" ")}
                    />
                  </div>
                  {passwordMismatch && (
                    <p className="mt-1 text-xs text-red-600">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                  />
                  <label htmlFor="agree" className="text-sm text-slate-600">
                    I agree to the{" "}
                    <Link href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Divider */}
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-500">OR CONTINUE WITH</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </div>

                {/* OAuth buttons (UI only) */}
{/* OAuth buttons */}
<div className="grid grid-cols-3 gap-3">

  {/* Google */}
  <button
    type="button"
    className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
<Image
  src="https://www.svgrepo.com/show/475656/google-color.svg"
  alt="Google"
  width={20}
  height={20}
/>
    Google
  </button>

  {/* GitHub */}
  <button
    type="button"
    className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
<Image
  src="https://www.svgrepo.com/show/512317/github-142.svg"
  alt="GitHub"
  width={20}
  height={20}
/>
    GitHub
  </button>

  {/* X */}
  <button
    type="button"
    className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
<Image
  src="https://www.svgrepo.com/show/513008/twitter-154.svg"
  alt="X"
  width={20}
  height={20}
/>
    X
  </button>

</div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "mt-1 w-full rounded-lg px-4 py-3 text-sm font-medium transition",
                    canSubmit
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}