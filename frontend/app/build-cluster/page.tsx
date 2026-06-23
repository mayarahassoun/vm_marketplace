"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Boxes, CheckCircle2, Cpu,
  Download, Globe, HardDrive, Loader2, Network,
  Server, ShieldCheck, Terminal,
} from "lucide-react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import {
  CardCvcElement, CardExpiryElement, CardNumberElement,
  Elements, useElements, useStripe,
} from "@stripe/react-stripe-js"
import AppLogo from "@/components/AppLogo"
import { API_URL, VM_IMAGES, clearAuthToken, getAuthToken } from "@/lib/api"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Static data ──────────────────────────────────────────────────────────────

const K8S_IMAGES = VM_IMAGES.filter(
  (img) => img.os === "Linux" && (img.distro === "Ubuntu" || img.distro === "Debian")
)

const MASTER_FLAVORS = [
  { id: "s6.large.4",   cpu: "2 vCPUs", ram: "8 GB",  price: 30, label: "Standard Master" },
  { id: "s6.xlarge.8",  cpu: "4 vCPUs", ram: "16 GB", price: 55, label: "Performance Master" },
  { id: "s6.2xlarge.8", cpu: "8 vCPUs", ram: "16 GB", price: 80, label: "High-CPU Master" },
]

const WORKER_FLAVORS = [
  { id: "s6.medium.2",  cpu: "1 vCPU",  ram: "4 GB",  price: 15, label: "Light Worker" },
  { id: "s6.large.4",   cpu: "2 vCPUs", ram: "8 GB",  price: 28, label: "Standard Worker" },
  { id: "s6.xlarge.8",  cpu: "4 vCPUs", ram: "16 GB", price: 50, label: "Heavy Worker" },
]

const PROFILES = [
  "Research Lab Cluster",
  "E-learning Platform",
  "Web Application Cluster",
  "AI / ML Training Cluster",
  "General Purpose Cluster",
]

const STEPS = [
  { id: 1, label: "Configuration" },
  { id: 2, label: "Node Specs" },
  { id: 3, label: "Network" },
  { id: 4, label: "Review" },
  { id: 5, label: "Payment" },
]

const CARD_STYLE = {
  style: { base: { fontSize: "14px", color: "#0f172a", "::placeholder": { color: "#94a3b8" } } },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressStep = {
  id: number
  label: string
  status: "pending" | "in_progress" | "complete" | "error"
}

type ProgressState = {
  steps: ProgressStep[]
  progress: number
  done: boolean
  error: string | null
  cluster_id: number | null
}

// ─── Payment form (needs Stripe Elements context) ─────────────────────────────

function PaymentForm({
  onBack,
  totalPrice,
  clusterData,
  onSuccess,
}: {
  onBack: () => void
  totalPrice: number
  clusterData: Record<string, unknown>
  onSuccess: (sessionId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) { clearAuthToken(); router.push("/auth/login"); return }

      const cardEl = elements.getElement(CardNumberElement)
      if (!cardEl) throw new Error("Card element not found")

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardEl,
        billing_details: { email },
      })
      if (stripeError) throw new Error(stripeError.message)
      if (!paymentMethod) throw new Error("Payment method not created")

      const res = await fetch(`${API_URL}/clusters/pay-and-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          email,
          amount: Math.round(totalPrice * 100),
          cluster_data: clusterData,
        }),
      })

      if (res.status === 401) {
        clearAuthToken()
        setError("Session expired. Redirecting to login...")
        setTimeout(() => router.push("/auth/login"), 1200)
        return
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Payment failed")
      }

      const { session_id } = await res.json()
      onSuccess(session_id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Card Number</label>
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <CardNumberElement options={CARD_STYLE} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Expiry</label>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <CardExpiryElement options={CARD_STYLE} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CVC</label>
          <div className="rounded-xl border border-slate-200 px-4 py-3">
            <CardCvcElement options={CARD_STYLE} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-green-600">
        <ShieldCheck className="h-4 w-4" />
        Secured by Stripe
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handlePay}
          disabled={loading || !stripe}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            : `Pay $${totalPrice}/mo`}
        </button>
      </div>
    </div>
  )
}

// ─── Real-time provisioning progress ─────────────────────────────────────────

function ProgressView({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [state, setState] = useState<ProgressState | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`${API_URL}/clusters/progress/${sessionId}`)
    esRef.current = es
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as ProgressState
      setState(data)
      if (data.done) es.close()
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [sessionId])

  function stepIcon(status: ProgressStep["status"]) {
    if (status === "complete")    return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (status === "in_progress") return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    if (status === "error")       return <div className="h-5 w-5 rounded-full bg-red-500" />
    return <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
  }

  async function downloadKubeconfig() {
    if (!state?.cluster_id) return
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/clusters/${state.cluster_id}/kubeconfig`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const { kubeconfig } = await res.json()
      const blob = new Blob([kubeconfig], { type: "text/yaml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "kubeconfig.yaml"
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const done = Boolean(state?.done && !state?.error)
  const hasError = Boolean(state?.done && state?.error)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Boxes className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {done ? "Cluster Ready!" : hasError ? "Provisioning Failed" : "Provisioning Cluster..."}
            </h1>
            <p className="text-sm text-slate-500">
              {done
                ? "Your Kubernetes cluster is up and running."
                : hasError
                ? "An error occurred. Check details below."
                : "This takes 10–15 minutes. We'll email you when it's ready."}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700"
            style={{ width: `${state?.progress ?? 0}%` }}
          />
        </div>

        {/* Steps list */}
        <div className="space-y-4">
          {(state?.steps ?? []).map((step) => (
            <div key={step.id} className="flex items-center gap-4">
              {stepIcon(step.status)}
              <span className={`text-sm ${
                step.status === "complete"    ? "font-medium text-slate-900" :
                step.status === "in_progress" ? "font-medium text-blue-600" :
                "text-slate-400"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {hasError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Error:</strong> {state?.error}
          </div>
        )}

        {done && (
          <div className="mt-8 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick start</p>
              <code className="mt-2 block text-sm text-slate-700">
                kubectl --kubeconfig=./kubeconfig.yaml get nodes
              </code>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadKubeconfig}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
              >
                <Download className="h-4 w-4" /> Download kubeconfig
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {!state && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Review item helper ───────────────────────────────────────────────────────

function ReviewItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}

// ─── Page header ─────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <AppLogo />
        <div className="hidden items-center gap-10 text-sm font-medium text-slate-700 md:flex">
          <Link href="/marketplace" className="hover:text-slate-900">Marketplace</Link>
          <Link href="/build-vm/instance" className="hover:text-slate-900">Build VM</Link>
          <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-200" />
      </div>
    </header>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function BuildClusterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Step 1
  const [clusterName, setClusterName] = useState(
    () => `k8s-cluster-${Math.random().toString(36).slice(2, 7)}`
  )
  const [profile, setProfile] = useState(PROFILES[0])
  const [workerCount, setWorkerCount] = useState(2)

  // Step 2
  const [imageId, setImageId] = useState(K8S_IMAGES[3]?.id ?? "")
  const [masterFlavorId, setMasterFlavorId] = useState(MASTER_FLAVORS[0].id)
  const [workerFlavorId, setWorkerFlavorId] = useState(WORKER_FLAVORS[1].id)
  const [diskSize, setDiskSize] = useState(50)

  // Step 3
  const [securityGroupId, setSecurityGroupId] = useState("3953708c-a708-435d-ab3c-6ef2c0ae0388")
  const [subnetId, setSubnetId] = useState("47a8cd69-519b-45fe-845b-23704f01ace6")
  const [az, setAz] = useState("tn-global-1a")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const passwordTypes = password.length > 0 ? [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length : 0
  const passwordLenOk = password.length >= 8 && password.length <= 26
  const passwordComplexOk = passwordTypes >= 3
  const passwordValid = passwordLenOk && passwordComplexOk
  const passwordError = password.length > 0 && !passwordValid

  const masterFlavor = MASTER_FLAVORS.find((f) => f.id === masterFlavorId) ?? MASTER_FLAVORS[0]
  const workerFlavor = WORKER_FLAVORS.find((f) => f.id === workerFlavorId) ?? WORKER_FLAVORS[1]
  const selectedImage = K8S_IMAGES.find((i) => i.id === imageId)
  const totalPrice = masterFlavor.price + workerFlavor.price * workerCount

  const clusterData = {
    cluster_name: clusterName,
    image_id: imageId,
    security_group_id: securityGroupId,
    subnet_id: subnetId,
    availability_zone: az,
    administrator_password: password,
    master_flavor_id: masterFlavorId,
    worker_flavor_id: workerFlavorId,
    system_disk_type: "SSD",
    system_disk_size: diskSize,
    worker_count: workerCount,
  }

  if (sessionId) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Header />
        <div className="mx-auto max-w-7xl px-6 py-10">
          <ProgressView sessionId={sessionId} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Stepper */}
        <nav className="mb-10 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                step === s.id ? "bg-black text-white" :
                step > s.id  ? "bg-green-500 text-white" :
                "bg-slate-100 text-slate-400"
              }`}>
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <span className={`hidden text-sm sm:block ${step === s.id ? "font-semibold text-slate-900" : "text-slate-400"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-5 bg-slate-200" />}
            </div>
          ))}
        </nav>

        {/* ── Step 1: Configuration ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Boxes className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Cluster Configuration</h2>
                <p className="text-sm text-slate-500">Name your cluster and choose a deployment profile.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Cluster Name</label>
                <input
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  placeholder="my-k8s-cluster"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                <p className="mt-1 text-xs text-slate-400">Lowercase letters, numbers and hyphens only.</p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Use Case Profile</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PROFILES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfile(p)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        profile === p
                          ? "border-black bg-black text-white"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Worker Nodes — <span className="font-bold text-slate-900">{workerCount}</span>
                </label>
                <input
                  type="range" min={1} max={5} value={workerCount}
                  onChange={(e) => setWorkerCount(Number(e.target.value))}
                  className="w-full accent-black"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!clusterName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Node Specs ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Cpu className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Node Specifications</h2>
                <p className="text-sm text-slate-500">Choose OS and hardware for master and worker nodes.</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* OS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Operating System</label>
                <p className="mb-3 text-xs text-slate-400">
                  Only Debian-based distros are supported (required for kubeadm).
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {K8S_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setImageId(img.id)}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                        imageId === img.id
                          ? "border-black bg-black text-white"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium">{img.name}</p>
                      <p className={`mt-1 text-xs ${imageId === img.id ? "text-slate-300" : "text-slate-400"}`}>
                        {img.distro}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Master flavor */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Master Node — Control Plane
                </label>
                <div className="space-y-2">
                  {MASTER_FLAVORS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setMasterFlavorId(f.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                        masterFlavorId === f.id
                          ? "border-black bg-black text-white"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold">{f.label}</p>
                        <p className={`text-xs ${masterFlavorId === f.id ? "text-slate-300" : "text-slate-500"}`}>
                          {f.cpu} · {f.ram}
                        </p>
                      </div>
                      <span className="font-semibold">${f.price}/mo</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Worker flavor */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Worker Nodes × {workerCount}
                </label>
                <div className="space-y-2">
                  {WORKER_FLAVORS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setWorkerFlavorId(f.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                        workerFlavorId === f.id
                          ? "border-black bg-black text-white"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold">{f.label}</p>
                        <p className={`text-xs ${workerFlavorId === f.id ? "text-slate-300" : "text-slate-500"}`}>
                          {f.cpu} · {f.ram}
                        </p>
                      </div>
                      <span className="font-semibold">
                        ${f.price}/mo × {workerCount} = ${f.price * workerCount}/mo
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disk */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  System Disk — <span className="font-bold text-slate-900">{diskSize} GB SSD</span>
                </label>
                <input
                  type="range" min={40} max={200} step={10} value={diskSize}
                  onChange={(e) => setDiskSize(Number(e.target.value))}
                  className="w-full accent-black"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>40 GB</span><span>200 GB</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Network ────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Network className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Network & Access</h2>
                <p className="text-sm text-slate-500">All nodes are deployed in the same VPC subnet.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Security Group ID</label>
                <input
                  value={securityGroupId}
                  onChange={(e) => setSecurityGroupId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Must allow: 6443 (API), 2379-2380 (etcd), 10250-10252 (kubelet), 30000-32767 (NodePort).
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Subnet ID</label>
                <input
                  value={subnetId}
                  onChange={(e) => setSubnetId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Availability Zone</label>
                <select
                  value={az}
                  onChange={(e) => setAz(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="tn-global-1a">tn-global-1a</option>
                  <option value="tn-global-1b">tn-global-1b</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Administrator Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entre 8 et 26 caractères"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-4 ${
                      passwordError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && !passwordLenOk && (
                  <p className="mt-1 text-xs text-red-500">
                    Entre 8 et 26 caractères ({password.length} actuellement).
                  </p>
                )}
                {password.length > 0 && passwordLenOk && !passwordComplexOk && (
                  <p className="mt-1 text-xs text-red-500">
                    Doit contenir au moins 3 types parmi : minuscules, majuscules, chiffres, caractères spéciaux. ({passwordTypes}/3)
                  </p>
                )}
                {passwordValid && (
                  <p className="mt-1 text-xs text-green-600">✓ Mot de passe valide</p>
                )}
                {password.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    8–26 caractères, 3 types minimum (ex : <code>Admin@2026</code>)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!subnetId.trim() || !securityGroupId.trim() || !passwordValid}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Review <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Review Your Cluster</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewItem icon={<Boxes className="h-4 w-4 text-blue-500" />}    label="Cluster Name"   value={clusterName} />
                <ReviewItem icon={<Server className="h-4 w-4 text-slate-400" />}  label="Profile"        value={profile} />
                <ReviewItem icon={<HardDrive className="h-4 w-4 text-slate-400" />} label="OS"           value={selectedImage?.name ?? imageId} />
                <ReviewItem icon={<Globe className="h-4 w-4 text-slate-400" />}   label="Region"         value={az} />
                <ReviewItem icon={<Cpu className="h-4 w-4 text-violet-500" />}    label="Master Node"    value={`${masterFlavor.label} — ${masterFlavor.cpu} · ${masterFlavor.ram}`} />
                <ReviewItem icon={<Cpu className="h-4 w-4 text-blue-500" />}      label={`Workers × ${workerCount}`} value={`${workerFlavor.label} — ${workerFlavor.cpu} · ${workerFlavor.ram}`} />
                <ReviewItem icon={<HardDrive className="h-4 w-4 text-slate-400" />} label="Disk / Node"  value={`${diskSize} GB SSD`} />
                <ReviewItem icon={<Terminal className="h-4 w-4 text-slate-400" />} label="Total Nodes"   value={`1 master + ${workerCount} worker${workerCount > 1 ? "s" : ""}`} />
              </div>

              <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Master node</span>
                  <span className="font-medium">${masterFlavor.price}/mo</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Workers × {workerCount}</span>
                  <span className="font-medium">${workerFlavor.price * workerCount}/mo</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ${totalPrice}<span className="text-sm font-normal text-slate-500">/mo</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white"
              >
                Proceed to Payment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Payment ────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
                <p className="text-sm text-slate-500">
                  Total: <span className="font-bold text-slate-900">${totalPrice}/month</span>
                </p>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <PaymentForm
                onBack={() => setStep(4)}
                totalPrice={totalPrice}
                clusterData={clusterData}
                onSuccess={(sid) => setSessionId(sid)}
              />
            </Elements>
          </div>
        )}

      </div>
    </div>
  )
}
