"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Server, Cpu, MemoryStick } from "lucide-react"
import { useMemo } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
const steps = [
  "Instance",
  "OS",
  "Storage",
  "Network",
  "Region",
  "Add-ons",
  "Details",
  "Review",
]

const instanceGroups = [
  {
    label: "1vCPU",
    options: [
      { id: "s6.medium.2", name: "s6.medium.2", cpu: "1 vCPU", ram: "2 GB RAM", price: 10 },
      { id: "s6.medium.4", name: "s6.medium.4", cpu: "1 vCPU", ram: "4 GB RAM", price: 15 },
    ],
  },
  {
    label: "2vCPU",
    options: [
      { id: "s6.large.2", name: "s6.large.2", cpu: "2 vCPU", ram: "4 GB RAM", price: 20 },
      { id: "s6.large.4", name: "s6.large.4", cpu: "2 vCPU", ram: "8 GB RAM", price: 30 },
    ],
  },
  {
    label: "4vCPU",
    options: [
      { id: "s6.xlarge.2", name: "s6.xlarge.2", cpu: "4 vCPU", ram: "8 GB RAM", price: 40 },
      { id: "s6.xlarge.4", name: "s6.xlarge.4", cpu: "4 vCPU", ram: "16 GB RAM", price: 60 },
    ],
  },
]

export default function BuildVMInstancePage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const selected = useMemo(() => {
    for (const group of instanceGroups) {
      const found = group.options.find((opt) => opt.id === data.instanceId)
      if (found) return found
    }
    return instanceGroups[0].options[0]
  }, [data.instanceId])

  const additionalDisksTotal = data.additionalDisks.reduce(
    (sum, disk) => sum + disk.price,
    0
  )

  const total =
    data.instancePrice +
    data.storagePrice +
    additionalDisksTotal +
    data.networkPrice +
    data.regionPrice

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <AppLogo />

          <div className="hidden items-center gap-10 text-sm font-medium text-slate-700 md:flex">
            <Link href="/marketplace" className="hover:text-slate-900">
              Marketplace
            </Link>
            <button className="hover:text-slate-900">Pricing</button>
            <button className="hover:text-slate-900">Documentation</button>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/marketplace"
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Build Your Custom VM
          </Link>

          <p className="max-w-4xl text-lg leading-8 text-slate-500">
            Design your perfect virtual machine by selecting the specifications that meet
            your exact requirements. Our custom VM builder allows you to choose CPU,
            memory, storage, and operating system options.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-6 inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
              {steps.map((step, index) => {
                const isActive = index === 0
                return (
                  <button
                    key={step}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {step}
                  </button>
                )
              })}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-800">
                VM Name
              </label>
              <input
                value={data.vmName}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    vmName: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-blue-500" />
                  <h2 className="text-2xl font-semibold text-slate-900">Instance Type</h2>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Select an instance type that fits your workload
                </p>
              </div>

              <div className="space-y-8">
                {instanceGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="mb-4 text-base font-semibold text-slate-900">{group.label}</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {group.options.map((option) => {
                        const checked = data.instanceId === option.id

                        return (
                          <label
                            key={option.id}
                            className={[
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                              checked
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:border-slate-300",
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name="instance"
                              checked={checked}
                              onChange={() =>
                                setData((prev) => ({
                                  ...prev,
                                  instanceId: option.id,
                                  instanceName: option.name,
                                  instanceCpu: option.cpu,
                                  instanceRam: option.ram,
                                  instancePrice: option.price,
                                }))
                              }
                              className="mt-1 h-4 w-4 accent-black"
                            />

                            <div>
                              <div className="text-lg font-semibold text-slate-900">
                                {option.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {option.cpu} • {option.ram}
                              </div>
                              <div className="mt-2 text-lg font-semibold text-blue-600">
                                ${option.price}/mo
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => router.push("/build-vm/os")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
              >
                Next: Operating System
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold text-slate-900">Pricing Summary</h2>

            <div className="mt-8 space-y-4 text-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Instance ({data.instanceName})</span>
                <span className="font-semibold text-slate-900">${data.instancePrice}/mo</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Storage ({data.storageSize} GB {data.storageType})
                </span>
                <span className="font-semibold text-slate-900">${data.storagePrice}/mo</span>
              </div>

              {additionalDisksTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Additional {data.additionalDisks.length} data disk(s)
                  </span>
                  <span className="font-medium text-slate-700">${additionalDisksTotal}/mo</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Network ({data.bandwidthSize} Mbps Standard)
                </span>
                <span className="font-semibold text-slate-900">${data.networkPrice}/mo</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Region ({data.region})</span>
                <span className="font-semibold text-slate-900">${data.regionPrice}/mo</span>
              </div>
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">Total</span>
              <span className="text-3xl font-semibold text-slate-900">${total}/mo</span>
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-500">
              Prices are shown in USD and billed monthly. Additional taxes may apply
              depending on your location.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}