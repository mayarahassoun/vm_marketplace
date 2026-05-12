"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBuildVM } from "../build-vm/BuildVMContext"
import { Sparkles, ArrowRight, Loader2, ArrowLeft } from "lucide-react"
import AuthGuard from "@/components/AuthGuard"
import { API_URL } from "@/lib/api"

type AIAssistantResult = {
  ready_to_deploy: {
    instance_flavor_id: string
    instance_image_id: string
    system_disk_size: number
    system_disk_type: "SSD" | "Business_SSD"
    estimated_monthly_cost: number
  }
  recommendation: {
    configuration: {
      flavor_id: string
      cpu: string
      ram: string
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
  extracted_parameters: Record<string, unknown>
  reasoned_parameters: {
    reasoning: {
      steps: string[]
    }
  }
}

export default function AIAssistantPage() {
  const router = useRouter()
  const { setData } = useBuildVM()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIAssistantResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRecommend() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${API_URL}/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_request: prompt }),
      })
      if (!res.ok) throw new Error("AI service unavailable")
      const data = (await res.json()) as AIAssistantResult
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI service unavailable")
    } finally {
      setLoading(false)
    }
  }

  function handleUseRecommendation() {
    if (!result) return
    const config = result.ready_to_deploy
    const recommendation = result.recommendation.configuration
    const storagePrice = config.system_disk_size >= 100 ? 10 : 5
    const instanceRam = recommendation.ram.includes("RAM")
      ? recommendation.ram
      : `${recommendation.ram} RAM`

    setData((prev) => ({
      ...prev,
      vmName: "ai-demo-vm",
      description: `Configuration recommandee par le moteur AI pour: ${prompt}`,
      instanceId: config.instance_flavor_id,
      instanceName: config.instance_flavor_id,
      instanceCpu: recommendation.cpu,
      instanceRam,
      instancePrice: config.estimated_monthly_cost,
      storageSize: config.system_disk_size,
      storageType: config.system_disk_type,
      storagePrice,
      additionalDisks: [],
      os: config.instance_image_id,
      osName: "Ubuntu-Server-24",
      bandwidthType: "External-01",
      bandwidthName: "ai-demo-bandwidth",
      bandwidthSize: 5,
      vpcMode: "existing",
      networkPrice: 0,
      region: "tn-global-1",
      regionLabel: "tn-global-1 (Tunisia)",
    }))

    router.push("/build-vm/details")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#fafafa] px-8 py-8">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-3">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">AI VM Assistant</h1>
                <p className="text-sm text-slate-500">
                  Describe your project and get an instant VM recommendation
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </div>

          {/* Input */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Describe your project
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleRecommend()
              }}
              placeholder="e.g. I need a VM for an ecommerce platform with 5000 users, high traffic..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 resize-none"
            />

            {/* Examples */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Small web app for 200 users",
                "University platform for 10000 students",
                "AI model training deep learning",
                "Ecommerce with 5000 customers high traffic",
                "Database server PostgreSQL 1000 users",
                "DevOps CI/CD pipeline small team",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:border-violet-300 hover:text-violet-600 transition"
                >
                  {example}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                ❌ {error}
              </div>
            )}

            <button
              onClick={handleRecommend}
              disabled={loading || !prompt.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your request...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get AI Recommendation
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-6 space-y-4">

              {/* Recommended Config */}
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-violet-900">
                  ✨ Recommended Configuration
                </h2>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Flavor</p>
                    <p className="font-semibold text-slate-900">
                      {result.recommendation.configuration.flavor_id}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">CPU / RAM</p>
                    <p className="font-semibold text-slate-900">
                      {result.recommendation.configuration.cpu} / {result.recommendation.configuration.ram}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Stockage</p>
                    <p className="font-semibold text-slate-900">
                      {result.ready_to_deploy.system_disk_size} GB {result.ready_to_deploy.system_disk_type}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Cout estime</p>
                    <p className="font-semibold text-violet-600 text-lg">
                      ${result.ready_to_deploy.estimated_monthly_cost}/mo
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-400">Cas d&apos;utilisation</p>
                  <p className="text-sm text-slate-700">
                    {result.recommendation.configuration.use_case}
                  </p>
                </div>

                {/* AI Scores */}
                <div className="mt-3 rounded-xl bg-white p-4">
                  <p className="mb-3 text-xs text-slate-400">Scores IA</p>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-600">
                        {result.recommendation.ai_scores.workload_score}/10
                      </div>
                      <div className="text-xs text-slate-400">Charge</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.recommendation.ai_scores.resource_score}/10
                      </div>
                      <div className="text-xs text-slate-400">Ressources</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {result.recommendation.ai_scores.criticality_score}/10
                      </div>
                      <div className="text-xs text-slate-400">Criticite</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Parameters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">
                  🔍 Extracted Parameters
                </h2>
                <div className="grid gap-2 md:grid-cols-3">
                  {Object.entries(result.extracted_parameters).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-400">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm font-medium text-slate-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              {result.reasoned_parameters.reasoning.steps.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="mb-3 text-sm font-semibold text-slate-700">
                    🧠 AI Reasoning
                  </h2>
                  <ul className="space-y-2">
                    {result.reasoned_parameters.reasoning.steps.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-400 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explanation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  💡 Explanation
                </h2>
                <p className="text-sm text-slate-600">
                  {result.recommendation.explanation}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  Resume de la decision
                </h2>
                <div className="space-y-2 text-sm leading-6 text-slate-600">
                  <p>{result.decision_summary.why_this_flavor}</p>
                  <p>{result.decision_summary.score_interpretation}</p>
                  <p className="text-slate-500">
                    {result.decision_summary.deployment_note}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleUseRecommendation}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-sm font-medium text-white hover:bg-slate-900 transition"
              >
                Utiliser cette configuration
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
