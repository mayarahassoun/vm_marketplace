"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  ArrowRight,
} from "lucide-react"
import { API_URL } from "@/lib/api"

type AiRecommendationResponse = {
  ai_analysis: {
    workload: string
    users: number
    app_type: string
    budget: string
    confidence: number
  }
  recommendation: {
    flavor_id: string
    cpu: string
    ram: string
    storage: number
    storage_type: string
  }
}

export default function AiRecommendationPage() {
  const router = useRouter()

  const [userRequest, setUserRequest] = useState(
    "Je veux une VM pour une application universitaire utilisée par 300 étudiants avec un budget moyen."
  )

  const [result, setResult] = useState<AiRecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleRecommend() {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(
        `${API_URL}/ai/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_request: userRequest,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "AI error")
      }

      setResult(data)
    } catch {
      setError(
        "Impossible de contacter le moteur IA. Vérifie que l’API IA est lancée."
      )
    } finally {
      setLoading(false)
    }
  }

  function useRecommendation() {
    if (!result) return

    // 🔥 On envoie la recommandation vers BuildVM
    const rec = result.recommendation

    const params = new URLSearchParams({
      flavor: rec.flavor_id,
      cpu: rec.cpu,
      ram: rec.ram,
      storage: String(rec.storage),
      storage_type: rec.storage_type,
    })

    router.push(`/build-vm?${params.toString()}`)
  }

  const rec = result?.recommendation

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              AI VM Recommendation
            </div>

            <h1 className="text-4xl font-bold text-slate-900">
              Smart VM Assistant
            </h1>

            <p className="mt-3 text-slate-600">
              Décrivez votre besoin et obtenez une configuration VM optimisée.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* INPUT */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Votre besoin</h2>

            <textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              rows={8}
              className="mt-4 w-full rounded-xl border p-3"
            />

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleRecommend}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-black py-3 text-white"
            >
              {loading ? "Analyse..." : "Recommander"}
            </button>
          </section>

          {/* RESULT */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            {!result ? (
              <div className="text-slate-400">
                Aucun résultat pour le moment
              </div>
            ) : (
              <div className="space-y-5">

                {/* FLAVOR */}
                <div className="rounded-xl bg-blue-50 p-5">
                  <p className="text-sm text-blue-600">Flavor recommandé</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {rec?.flavor_id}
                  </p>
                </div>

                {/* SPECS */}
                <div className="grid grid-cols-2 gap-4">

                  <Info
                    icon={<Cpu className="h-4 w-4" />}
                    label="CPU"
                    value={rec?.cpu || "N/A"}
                  />

                  <Info
                    icon={<MemoryStick className="h-4 w-4" />}
                    label="RAM"
                    value={rec?.ram || "N/A"}
                  />

                  <Info
                    icon={<HardDrive className="h-4 w-4" />}
                    label="Storage"
                    value={`${rec?.storage ?? 0} GB`}
                  />

                  <Info
                    icon={<Server className="h-4 w-4" />}
                    label="Type"
                    value={rec?.storage_type || "SSD"}
                  />
                </div>

                {/* APPLY */}
                <button
                  onClick={useRecommendation}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-white"
                >
                  Utiliser pour créer VM
                  <ArrowRight className="h-4 w-4" />
                </button>

              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  )
}
