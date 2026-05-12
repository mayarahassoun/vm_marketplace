"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { login } from "@/lib/api"
import Image from "next/image"
import AppLogo from "@/components/AppLogo"


export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      return
    }

    try {
      setLoading(true)

      const data = await login(email, password)

      localStorage.setItem("token", data.access_token)

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
      } else {
        localStorage.removeItem("rememberMe")
      }

      router.push("/dashboard")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        {/* LEFT SIDE */}
        <section className="rounded-2xl bg-[#06132d] p-10 text-white shadow-xl">
          <div className="flex h-full flex-col justify-between">
            <div>
              <h1 className="max-w-md text-4xl font-bold leading-tight">
                Welcome back to VM Marketplace
              </h1>

              <p className="mt-5 max-w-md text-lg text-slate-300">
                Access your virtual machines, manage deployments, and monitor usage
                all in one place.
              </p>

              <div className="mt-10 rounded-2xl bg-white/5 p-6">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                      ✓
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Deploy in seconds</p>
                      <p className="text-sm text-slate-300">
                        Launch new VMs with just a few clicks
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                      ✓
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Secure infrastructure</p>
                      <p className="text-sm text-slate-300">
                        Enterprise-grade security for all your VMs
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                      ✓
                    </div>
                    <div>
                      <p className="text-lg font-semibold">24/7 monitoring</p>
                      <p className="text-sm text-slate-300">
                        Real-time insights and alerts for your VMs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-sm font-semibold">
              N
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to Home
            </Link>

            <div className="flex items-center gap-3">
              <AppLogo />
              <span className="text-2xl font-bold text-slate-900">VM Marketplace</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-4xl font-semibold text-slate-900">Login</h2>
            <p className="mt-2 text-base text-slate-500">
              Enter your credentials to access your account
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => alert("Forgot password feature not implemented yet.")}
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Remember me for 30 days
              </label>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

<div className="grid grid-cols-3 gap-3">
  <button
    type="button"
    className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    title="Google (UI only)"
  >
<Image
  src="https://www.svgrepo.com/show/475656/google-color.svg"
  alt="Google"
  width={20}
  height={20}
/>
    <span>Google</span>
  </button>

  <button
    type="button"
    className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    title="GitHub (UI only)"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.699-2.782.605-3.369-1.344-3.369-1.344-.455-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.349-1.088.635-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.56 9.56 0 012.504.337c1.909-1.296 2.748-1.026 2.748-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.857 0 1.34-.012 2.422-.012 2.75 0 .268.18.579.688.481A10.019 10.019 0 0022 12.017C22 6.484 17.523 2 12 2z" />
    </svg>
    <span>GitHub</span>
  </button>

<button
  type="button"
  className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
  title="X (UI only)"
>
  <Image
    src="https://www.svgrepo.com/show/513008/twitter-154.svg"
    alt="X"
    width={20}
    height={20}
  />
  <span>X</span>
</button>
</div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
