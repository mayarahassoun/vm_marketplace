"use client"

import AuthGuard from "@/components/AuthGuard"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Server } from "lucide-react"
import { useMemo, useState } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import BuildVMSteps from "../BuildVMSteps"

const flavorsByEcsType = {
  "General-purpose": [
    { id: "s6.medium.2", name: "s6.medium.2", cpu: 1, ram: 2, vendor: "Intel", price: 10 },
    { id: "s6.medium.4", name: "s6.medium.4", cpu: 1, ram: 4, vendor: "Intel", price: 15 },
    { id: "s6.large.2", name: "s6.large.2", cpu: 2, ram: 4, vendor: "Intel", price: 20 },
    { id: "s6.large.4", name: "s6.large.4", cpu: 2, ram: 8, vendor: "Intel", price: 30 },
    { id: "s6.xlarge.2", name: "s6.xlarge.2", cpu: 4, ram: 8, vendor: "Intel", price: 40 },
    { id: "s6.xlarge.4", name: "s6.xlarge.4", cpu: 4, ram: 16, vendor: "Intel", price: 60 },
    { id: "s6.2xlarge.2", name: "s6.2xlarge.2", cpu: 8, ram: 16, vendor: "Intel", price: 90 },
    { id: "s6.2xlarge.3", name: "s6.2xlarge.3", cpu: 8, ram: 24, vendor: "Intel", price: 110 },
    { id: "s6.2xlarge.4", name: "s6.2xlarge.4", cpu: 8, ram: 32, vendor: "Intel", price: 130 },
    { id: "s6.3xlarge", name: "s6.3xlarge", cpu: 12, ram: 12, vendor: "Intel", price: 150 },
    { id: "s6.3xlarge.2", name: "s6.3xlarge.2", cpu: 12, ram: 24, vendor: "Intel", price: 170 },
    { id: "s6.3xlarge.3", name: "s6.3xlarge.3", cpu: 12, ram: 32, vendor: "Intel", price: 190 },
    { id: "s6.4xlarge", name: "s6.4xlarge", cpu: 16, ram: 16, vendor: "Intel", price: 210 },
    { id: "s6.4xlarge.2", name: "s6.4xlarge.2", cpu: 16, ram: 32, vendor: "Intel", price: 230 },
    { id: "s6.4xlarge.4", name: "s6.4xlarge.4", cpu: 16, ram: 64, vendor: "Intel", price: 260 },
    { id: "s6.5xlarge.1", name: "s6.5xlarge.1", cpu: 24, ram: 24, vendor: "Intel", price: 300 },
    { id: "s6.5xlarge.2", name: "s6.5xlarge.2", cpu: 24, ram: 32, vendor: "Intel", price: 320 },
    { id: "s6.5xlarge.3", name: "s6.5xlarge.3", cpu: 24, ram: 48, vendor: "Intel", price: 350 },
    { id: "s6.5xlarge.4", name: "s6.5xlarge.4", cpu: 24, ram: 64, vendor: "Intel", price: 380 },
    { id: "s6.6xlarge", name: "s6.6xlarge", cpu: 32, ram: 32, vendor: "Intel", price: 420 },
    { id: "s6.6xlarge.1", name: "s6.6xlarge.1", cpu: 32, ram: 48, vendor: "Intel", price: 450 },
    { id: "Cloud_RSE", name: "Cloud_RSE", cpu: 32, ram: 48, vendor: "Intel", price: 450 },
    { id: "s6.6xlarge.2", name: "s6.6xlarge.2", cpu: 32, ram: 64, vendor: "Intel", price: 480 },
    { id: "SMC_SC", name: "SMC_SC", cpu: 32, ram: 64, vendor: "Intel", price: 480 },
    { id: "s6.6xlarge.3", name: "s6.6xlarge.3", cpu: 32, ram: 128, vendor: "Intel", price: 560 },
    { id: "Cloud_MCU", name: "Cloud_MCU", cpu: 48, ram: 72, vendor: "Intel", price: 650 },
    { id: "s6.7xlarge", name: "s6.7xlarge", cpu: 64, ram: 32, vendor: "Intel", price: 700 },
    { id: "s6.7xlarge.1", name: "s6.7xlarge.1", cpu: 64, ram: 64, vendor: "Intel", price: 760 },
    { id: "s6.7xlarge.2", name: "s6.7xlarge.2", cpu: 64, ram: 128, vendor: "Intel", price: 880 },
    { id: "s6.7xlarge.3", name: "s6.7xlarge.3", cpu: 64, ram: 256, vendor: "Intel", price: 1100 },
    { id: "s6.8xlarge", name: "s6.8xlarge", cpu: 128, ram: 64, vendor: "Intel", price: 1300 },
    { id: "s6.8xlarge.1", name: "s6.8xlarge.1", cpu: 128, ram: 128, vendor: "Intel", price: 1500 },
    { id: "s6.8xlarge.2", name: "s6.8xlarge.2", cpu: 128, ram: 256, vendor: "Intel", price: 1800 },
    { id: "s6.8xlarge.3", name: "s6.8xlarge.3", cpu: 128, ram: 512, vendor: "Intel", price: 2200 },
  ],
  "Memory-optimized": [
    { id: "m6.large.8", name: "m6.large.8", cpu: 2, ram: 16, vendor: "Intel", price: 80 },
    { id: "m6.xlarge.8", name: "m6.xlarge.8", cpu: 4, ram: 32, vendor: "Intel", price: 140 },
    { id: "m6.2xlarge.8", name: "m6.2xlarge.8", cpu: 8, ram: 64, vendor: "Intel", price: 260 },
    { id: "m6.4xlarge.8", name: "m6.4xlarge.8", cpu: 16, ram: 128, vendor: "Intel", price: 520 },
    { id: "e3.7xlarge.12", name: "e3.7xlarge.12", cpu: 28, ram: 348, vendor: "Intel", price: 900 },
    { id: "m6.8xlarge.8", name: "m6.8xlarge.8", cpu: 32, ram: 256, vendor: "Intel", price: 980 },
    { id: "e3.14xlarge.12", name: "e3.14xlarge.12", cpu: 56, ram: 696, vendor: "Intel", price: 1800 },
    { id: "m6.16xlarge.8", name: "m6.16xlarge.8", cpu: 64, ram: 512, vendor: "Intel", price: 1900 },
    { id: "e3.26xlarge.14", name: "e3.26xlarge.14", cpu: 104, ram: 1466, vendor: "Intel", price: 3200 },
    { id: "e3.52xlarge.14", name: "e3.52xlarge.14", cpu: 208, ram: 2932, vendor: "Intel", price: 6000 },
  ],
  "GPU-accelerated": [
    { id: "p2s.2xlarge.8", name: "p2s.2xlarge.8", cpu: 8, ram: 64, vendor: "Intel", price: 600 },
    { id: "p2s.4xlarge.8", name: "p2s.4xlarge.8", cpu: 16, ram: 32, vendor: "Intel", price: 750 },
    { id: "p2s.8xlarge.8", name: "p2s.8xlarge.8", cpu: 32, ram: 64, vendor: "Intel", price: 1100 },
    { id: "p2s.16xlarge.8", name: "p2s.16xlarge.8", cpu: 64, ram: 128, vendor: "Intel", price: 1800 },
    { id: "p2s.16xlarge.16", name: "p2s.16xlarge.16", cpu: 64, ram: 256, vendor: "Intel", price: 2300 },
    { id: "p3s.16xlarge.16", name: "p3s.16xlarge.16", cpu: 96, ram: 256, vendor: "Intel", price: 2800 },
  ],
  "vGPU-accelerated": [
    { id: "v3.xlarge.4", name: "v3.xlarge.4", cpu: 4, ram: 16, vendor: "Intel", gpu: "A40-24A x 1", price: 350 },
    { id: "g5.xlarge", name: "g5.xlarge", cpu: 8, ram: 16, vendor: "Intel", price: 430 },
    { id: "g5.2xlarge", name: "g5.2xlarge", cpu: 8, ram: 32, vendor: "Intel", price: 520 },
    { id: "g6.xlarge", name: "g6.xlarge", cpu: 24, ram: 48, vendor: "Intel", price: 950 },
    { id: "g6.2xlarge", name: "g6.2xlarge", cpu: 32, ram: 64, vendor: "Intel", price: 1200 },
    { id: "g6.2xlarge-AP", name: "g6.2xlarge-AP", cpu: 32, ram: 64, vendor: "Intel", price: 1200 },
    { id: "g6.2xlarge.2", name: "g6.2xlarge.2", cpu: 32, ram: 128, vendor: "Intel", price: 1500 },
    { id: "g6.2xlarge.4", name: "g6.2xlarge.4", cpu: 64, ram: 128, vendor: "Intel", price: 2100 },
    { id: "g6.2xlarge.5", name: "g6.2xlarge.5", cpu: 64, ram: 256, vendor: "Intel", price: 2600 },
    { id: "g6.3xlarge", name: "g6.3xlarge", cpu: 128, ram: 256, vendor: "Intel", price: 3900 },
  ],
} as const

type EcsType = keyof typeof flavorsByEcsType

type FlavorOption = {
  id: string
  name: string
  cpu: number
  ram: number
  vendor: string
  price: number
  gpu?: string
}

export default function BuildVMInstancePage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const [ecsType, setEcsType] = useState<EcsType>("General-purpose")
  const [cpuFilter, setCpuFilter] = useState("All")
  const [ramFilter, setRamFilter] = useState("All")
  const [searchFlavor, setSearchFlavor] = useState("")

  const total =
    data.instancePrice +
    data.storagePrice +
    data.networkPrice +
    data.regionPrice

  const currentFlavors = flavorsByEcsType[ecsType]

  const cpuOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(currentFlavors.map((item) => item.cpu))).sort(
        (a, b) => a - b
      ),
    ]
  }, [currentFlavors])

  const ramOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(currentFlavors.map((item) => item.ram))).sort(
        (a, b) => a - b
      ),
    ]
  }, [currentFlavors])

  const filteredFlavors = useMemo(() => {
    return currentFlavors.filter((item) => {
      const matchesCpu = cpuFilter === "All" || item.cpu === Number(cpuFilter)
      const matchesRam = ramFilter === "All" || item.ram === Number(ramFilter)
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchFlavor.toLowerCase())

      return matchesCpu && matchesRam && matchesSearch
    })
  }, [currentFlavors, cpuFilter, ramFilter, searchFlavor])

  const selectFlavor = (option: FlavorOption) => {
    setData((prev) => ({
      ...prev,
      instanceId: option.id,
      instanceName: option.name,
      instanceCpu: `${option.cpu} vCPU`,
      instanceRam: `${option.ram} GB RAM`,
      instancePrice: option.price,
    }))
  }

  const selectedFlavor =
    currentFlavors.find((item) => item.id === data.instanceId) ||
    currentFlavors[0]

  return (
    <AuthGuard>
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
              your exact requirements.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <BuildVMSteps active="Instance" />

             

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Instance Type
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Select an instance type that fits your workload
                    </p>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-100 p-1 xl:grid-cols-4">
                  {Object.keys(flavorsByEcsType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const typedKey = type as EcsType
                        setEcsType(typedKey)
                        setCpuFilter("All")
                        setRamFilter("All")
                        setSearchFlavor("")
                        selectFlavor(flavorsByEcsType[typedKey][0])
                      }}
                      className={[
                        "rounded-lg px-4 py-2 text-sm font-medium transition",
                        ecsType === type
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      ].join(" ")}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="mb-6 grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
                  <select
                    value={cpuFilter}
                    onChange={(e) => setCpuFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {cpuOptions.map((cpu) => (
                      <option key={cpu} value={cpu}>
                        {cpu === "All" ? "All vCPUs" : `${cpu} vCPUs`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={ramFilter}
                    onChange={(e) => setRamFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {ramOptions.map((ram) => (
                      <option key={ram} value={ram}>
                        {ram === "All" ? "All Memory" : `${ram} GB RAM`}
                      </option>
                    ))}
                  </select>

                  <input
                    value={searchFlavor}
                    onChange={(e) => setSearchFlavor(e.target.value)}
                    placeholder="Search flavor..."
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className="w-14 border-b border-slate-200 px-4 py-3"></th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                          Flavor
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                          vCPUs | Memory
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                          CPU Vendor
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredFlavors.map((option) => {
                        const checked = data.instanceId === option.id

                        return (
                          <tr
                            key={option.id}
                            onClick={() => selectFlavor(option)}
                            className={[
                              "cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50",
                              checked ? "bg-slate-50" : "bg-white",
                            ].join(" ")}
                          >
                            <td className="px-4 py-4 text-center">
                              <input
                                type="radio"
                                name="instance"
                                checked={checked}
                                onChange={() => selectFlavor(option)}
                                className="h-4 w-4 accent-black"
                              />
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {option.name}
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {option.cpu} vCPU • {option.ram} GB RAM
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {option.vendor}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filteredFlavors.length === 0 && (
                    <div className="px-6 py-8 text-sm text-slate-400">
                      No flavors found for &quot;{searchFlavor}&quot;
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="text-slate-500">Current Flavor</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {ecsType} / {selectedFlavor.name} · {selectedFlavor.cpu} vCPU ·{" "}
                    {selectedFlavor.ram} GB RAM · {selectedFlavor.vendor}
                    {"gpu" in selectedFlavor && selectedFlavor.gpu
                      ? ` · vGPU Card: ${selectedFlavor.gpu}`
                      : ""}
                  </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Network ({data.bandwidthSize} Mbps)
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${data.networkPrice}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Region ({data.region})</span>
                  <span className="font-semibold text-slate-900">
                    ${data.regionPrice}/mo
                  </span>
                </div>
              </div>
              <div className="my-6 border-t border-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-slate-900">Total</span>
                <span className="text-3xl font-semibold text-slate-900">${total}/mo</span>
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-500">
                Prices are shown in USD and billed monthly.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
