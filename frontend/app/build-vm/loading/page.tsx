"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import { API_URL } from "@/lib/api"

type Step = {
  id: number
  label: string
  status: "pending" | "in_progress" | "complete" | "error"
}

function LoadingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: "Verifying Payment", status: "pending" },
    { id: 2, label: "Initializing VM Environment", status: "pending" },
    { id: 3, label: "Configuring Security Settings", status: "pending" },
    { id: 4, label: "Generating Access Credentials", status: "pending" },
    { id: 5, label: "Finalizing Deployment", status: "pending" },
  ])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const eventSource = new EventSource(
      `${API_URL}/payment/progress/${sessionId}`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.error) {
        setError(data.error)
        eventSource.close()
        return
      }

      setSteps(data.steps)
      setProgress(data.progress)

      if (data.done && !data.error) {
  eventSource.close()
  setTimeout(() => router.push(`/build-vm/success?session_id=${sessionId}`), 1500)
}
    }

    eventSource.onerror = () => {
      setError("Connection lost")
      eventSource.close()
    }

    return () => eventSource.close()
  }, [router, sessionId])

  function StepIcon({ status }: { status: string }) {
    if (status === "complete")
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (status === "in_progress")
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    if (status === "error")
      return <XCircle className="h-5 w-5 text-red-500" />
    return <Circle className="h-5 w-5 text-slate-300" />
  }

  function StepLabel({ status }: { status: string }) {
    if (status === "complete")
      return <span className="text-sm font-medium text-green-600">Complete</span>
    if (status === "in_progress")
      return <span className="text-sm font-medium text-blue-500">In Progress...</span>
    if (status === "error")
      return <span className="text-sm font-medium text-red-500">Failed</span>
    return <span className="text-sm text-slate-400">Waiting...</span>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="w-[500px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Setting Up Your Virtual Machine
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while we prepare your environment...
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            ❌ {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StepIcon status={step.status} />
                <span className={`text-sm font-medium ${
                  step.status === "pending" ? "text-slate-400" : "text-slate-900"
                }`}>
                  {step.label}
                </span>
              </div>
              <StepLabel status={step.status} />
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoadingPage() {
  return (
    <Suspense fallback={null}>
      <LoadingPageContent />
    </Suspense>
  )
}
