"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { ArrowLeft, Activity, Cpu, MemoryStick, Network } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { API_URL, getAuthToken } from "@/lib/api"

type MetricPoint = {
  time: string
  value: number
}

type Metrics = {
  cpu: MetricPoint[]
  ram: MetricPoint[]
  network_in: MetricPoint[]
  network_out: MetricPoint[]
}

function MonitoringPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vmId = searchParams.get("vm_id")
  const vmName = searchParams.get("name")

  const [metrics, setMetrics] = useState<Metrics>({
    cpu: [],
    ram: [],
    network_in: [],
    network_out: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vmId) return

    async function fetchMetrics() {
      try {
        const token = getAuthToken()
        if (!token) {
          router.push("/auth/login")
          return
        }

        const res = await fetch(`${API_URL}/monitoring/${vmId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch metrics")
        const data = await res.json()
        setMetrics(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    // Refresh toutes les 10 secondes
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [router, vmId])

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Monitoring — {vmName}
            </h1>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Live — updates every 10s
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading metrics...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">

          {/* CPU */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">CPU Usage</h2>
              <span className="ml-auto text-2xl font-bold text-blue-600">
                {metrics.cpu.length > 0
                  ? `${metrics.cpu[metrics.cpu.length - 1].value.toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics.cpu}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#eff6ff"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* RAM */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-slate-900">RAM Usage</h2>
              <span className="ml-auto text-2xl font-bold text-violet-600">
                {metrics.ram.length > 0
                  ? `${metrics.ram[metrics.ram.length - 1].value.toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics.ram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#f5f3ff"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Network In */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Network className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-slate-900">Network In</h2>
              <span className="ml-auto text-2xl font-bold text-green-600">
                {metrics.network_in.length > 0
                  ? `${metrics.network_in[metrics.network_in.length - 1].value.toFixed(2)} KB/s`
                  : "N/A"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.network_in}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Network Out */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Network className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900">Network Out</h2>
              <span className="ml-auto text-2xl font-bold text-orange-600">
                {metrics.network_out.length > 0
                  ? `${metrics.network_out[metrics.network_out.length - 1].value.toFixed(2)} KB/s`
                  : "N/A"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.network_out}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  )
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={null}>
      <MonitoringPageContent />
    </Suspense>
  )
}
