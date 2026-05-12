"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { CheckCircle2, Download, LayoutDashboard, Loader2 } from "lucide-react"
import { API_URL } from "@/lib/api"

type VMInfo = {
  id: number
  instance_name: string
  public_ip: string
  region: string
  created_at: string
  flavor_id: string
  image_id: string
  system_disk_size: number
}

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [vm, setVm] = useState<VMInfo | null>(null)
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [error, setError] = useState<string | null>(
    sessionId ? null : "Session ID not found."
  )

  useEffect(() => {
    if (!sessionId) {
      return
    }

    let stopped = false
    let attempts = 0
    const maxAttempts = 30

    async function fetchVM() {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("authToken")

        if (!token) {
          setError("You must be logged in to view this VM.")
          setLoading(false)
          return
        }

        const res = await fetch(
          `${API_URL}/payment/session/${sessionId}/vm`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setError(data.detail || "VM not found.")
          setLoading(false)
          return
        }

        if (data.status === "pending") {
          attempts += 1

          if (attempts >= maxAttempts) {
            setError("VM creation is taking longer than expected. Please check the dashboard.")
            setLoading(false)
            return
          }

          setTimeout(() => {
            if (!stopped) fetchVM()
          }, 3000)

          return
        }

        setVm(data)
        setError(null)
        setLoading(false)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unable to load VM information.")
        setLoading(false)
      }
    }

    fetchVM()

    return () => {
      stopped = true
    }
  }, [sessionId])

  function handleDownload() {
    if (!vm) return

    const content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
            h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
            h2 { color: #0f172a; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { padding: 10px; border: 1px solid #e2e8f0; }
            td:first-child { font-weight: bold; background: #f8fafc; width: 40%; }
            .ssh { background: #0f172a; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-family: monospace; margin-top: 10px; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
            .badge { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>✅ VM Credentials</h1>
          <p>Your virtual machine has been successfully deployed and is ready to use. <span class="badge">Running</span></p>

          <h2>🖥️ VM Details</h2>
          <table>
            <tr><td>VM Name</td><td>${vm.instance_name}</td></tr>
            <tr><td>Public IP</td><td>${vm.public_ip || "N/A"}</td></tr>
            <tr><td>Region</td><td>${vm.region}</td></tr>
            <tr><td>Flavor</td><td>${vm.flavor_id}</td></tr>
            <tr><td>Disk</td><td>${vm.system_disk_size} GB</td></tr>
            <tr><td>Created</td><td>${new Date(vm.created_at).toLocaleString()}</td></tr>
          </table>

          <h2>🔐 Access Credentials</h2>
          <table>
            <tr><td>Username</td><td>root</td></tr>
            <tr><td>Password</td><td>Your VM password (set during creation)</td></tr>
          </table>

          <h2>💻 SSH Connection</h2>
          <div class="ssh">ssh root@${vm.public_ip}</div>

          <h2>📊 Monitoring</h2>
          <table>
            <tr><td>Netdata Dashboard</td><td>http://${vm.public_ip}:19999</td></tr>
          </table>

          <div class="footer">
            VM Marketplace — mesrscloud.rnu.tn — Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-green-600" />
          <p className="text-slate-500">Waiting for VM creation...</p>
          <p className="mt-1 text-xs text-slate-400">
            This can take a few seconds.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="w-[460px] rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-red-600">
            Unable to load VM
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {error}
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-slate-900"
            >
              Retry
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="w-[420px] rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">
          VM Created Successfully!
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Your custom VM has been deployed and is ready to use.
        </p>

        {vm && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-900">
                {vm.instance_name}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Public IP</span>
              <span className="font-medium text-slate-900">
                {vm.public_ip || "N/A"}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Region</span>
              <span className="font-medium text-slate-900">
                {vm.region}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Disk</span>
              <span className="font-medium text-slate-900">
                {vm.system_disk_size} GB
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Download your VM credentials to access your virtual machine.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleDownload}
            disabled={!vm}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download VM Credentials
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessPageContent />
    </Suspense>
  )
}
