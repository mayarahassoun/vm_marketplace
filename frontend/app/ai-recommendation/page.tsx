"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  Sparkles,
} from "lucide-react"
import { API_URL } from "@/lib/api"

type RecommendationResult = {
  llm_used: boolean
  extracted_parameters: Record<string, unknown>
  reasoned_parameters: {
    application_type: string
    expected_users: number
    traffic_level: string
    budget: string
    performance_level: string
    storage_need: number
    reasoning: {
      steps: string[]
    }
  }
  recommendation: {
    recommended_profile: string
    configuration: {
      flavor_id: string
      cpu: string
      ram: string
      storage: number
      storage_type: string
      monthly_price: number
      use_case: string
    }
    ai_scores: {
      workload_score: number
      resource_score: number
      criticality_score: number
    }
    explanation: string
  }
  decision_summary: {
    why_this_flavor: string
    score_interpretation: string
    deployment_note: string
  }
  ready_to_deploy: {
    instance_flavor_id: string
    system_disk_size: number
    system_disk_type: string
    estimated_monthly_cost: number
  }
}

export default function AiRecommendationPage() {
  const [userRequest, setUserRequest] = useState(
    "Je veux une VM pour une application universitaire utilisée par 300 étudiants avec un budget moyen."
  )
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleRecommend() {
    if (!userRequest.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_request: userRequest }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "AI engine unavailable")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI engine unavailable")
    } finally {
      setLoading(false)
    }
  }

  const config = result?.recommendation.configuration
  const scores = result?.recommendation.ai_scores

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              Recommandation IA VM
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Assistant intelligent de recommandation VM
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Decrivez le besoin de votre application et obtenez une VM adaptee,
              avec les besoins extraits, les scores de raisonnement et une justification.
            </p>
          </div>

          <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm">
            Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Besoin utilisateur</h2>
            <textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              rows={8}
              className="mt-4 w-full resize-none rounded-xl border p-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleRecommend}
              disabled={loading || !userRequest.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BrainCircuit className="h-4 w-4" />
              {loading ? "Analyse..." : "Recommander"}
            </button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            {!result || !config || !scores ? (
              <div className="flex h-full min-h-80 items-center justify-center text-slate-400">
                Aucun résultat pour le moment
              </div>
            ) : (
              <div className="space-y-5">
                {!result.llm_used && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Ollama est indisponible. Le moteur utilise une extraction deterministe.
                  </div>
                )}

                <div className="rounded-xl bg-blue-50 p-5">
                  <p className="text-sm text-blue-600">Flavor recommandé</p>
                  <p className="text-3xl font-bold text-blue-950">
                    {config.flavor_id}
                  </p>
                  <p className="mt-2 text-sm text-blue-900">{config.use_case}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Info icon={<Cpu className="h-4 w-4" />} label="CPU" value={config.cpu} />
                  <Info icon={<MemoryStick className="h-4 w-4" />} label="RAM" value={config.ram} />
                  <Info icon={<HardDrive className="h-4 w-4" />} label="Stockage" value={`${result.ready_to_deploy.system_disk_size} GB ${result.ready_to_deploy.system_disk_type}`} />
                  <Info icon={<Database className="h-4 w-4" />} label="Cout estime" value={`$${result.ready_to_deploy.estimated_monthly_cost}/mo`} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Score label="Charge" value={scores.workload_score} />
                  <Score label="Ressources" value={scores.resource_score} />
                  <Score label="Criticite" value={scores.criticality_score} />
                </div>

                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold text-slate-900">Resume de la decision</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {result.decision_summary.why_this_flavor}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {result.decision_summary.score_interpretation}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {result.decision_summary.deployment_note}
                  </p>
                </div>

                {result.reasoned_parameters.reasoning.steps.length > 0 && (
                  <div className="rounded-xl border p-4">
                    <h3 className="font-semibold text-slate-900">Etapes du raisonnement</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {result.reasoned_parameters.reasoning.steps.map((step) => (
                        <li key={step} className="flex gap-2">
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}/10</p>
    </div>
  )
}
