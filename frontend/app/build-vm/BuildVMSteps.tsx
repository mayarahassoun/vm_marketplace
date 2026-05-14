"use client"

import { useRouter } from "next/navigation"

const steps = [
  { label: "Instance", href: "/build-vm/instance" },
  { label: "OS", href: "/build-vm/os" },
  { label: "Storage", href: "/build-vm/storage" },
  { label: "Network", href: "/build-vm/network" },
  { label: "Region", href: "/build-vm/region" },
  { label: "Details", href: "/build-vm/details" },
  { label: "Review", href: "/build-vm/review" },
]

export default function BuildVMSteps({ active }: { active: string }) {
  const router = useRouter()

  return (
    <div className="mb-6 inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
      {steps.map((step) => {
        const isActive = step.label === active

        return (
          <button
            key={step.label}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => router.push(step.href)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-800",
            ].join(" ")}
          >
            {step.label}
          </button>
        )
      })}
    </div>
  )
}
