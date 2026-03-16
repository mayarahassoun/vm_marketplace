"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronRight,
  Network,
  ShieldCheck,
  PlusCircle,
} from "lucide-react"
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

export default function BuildVMNetworkPage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const additionalDisksTotal = useMemo(
    () => data.additionalDisks.reduce((sum, disk) => sum + disk.price, 0),
    [data.additionalDisks]
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
            href="/build-vm/storage"
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
                const isActive = index === 3
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

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Network className="h-5 w-5 text-blue-500" />
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Bandwidth Configuration
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Configure the public network bandwidth for your VM
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Bandwidth Type
                    </label>
                    <select
                      value={data.bandwidthType}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          bandwidthType: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    >
                      <option>External-01</option>
                      <option>External-02</option>
                      <option>Premium-Internet</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Bandwidth Name
                    </label>
                    <input
                      value={data.bandwidthName}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          bandwidthName: e.target.value,
                        }))
                      }
                      placeholder="Enter bandwidth name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-800">
                      Bandwidth Size
                    </label>
                    <span className="text-lg font-semibold text-slate-900">
                      {data.bandwidthSize} Mbps
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={data.bandwidthSize}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        bandwidthSize: Number(e.target.value),
                        networkPrice: 0,
                      }))
                    }
                    className="w-full accent-black"
                  />

                  <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                    <span>5 Mbps</span>
                    <span>300 Mbps</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <p className="font-medium">Bandwidth Configuration Summary</p>
                  <p className="mt-2">Type: {data.bandwidthType}</p>
                  <p>Name: {data.bandwidthName || "Not specified"}</p>
                  <p>Size: {data.bandwidthSize} Mbps</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-violet-500" />
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      VPC & Subnet Configuration
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose to use an existing VPC or create a new one
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium text-slate-800">
                    VPC Configuration
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="radio"
                        name="vpc-mode"
                        checked={data.bandwidthName === "existing-vpc"}
                        onChange={() =>
                          setData((prev) => ({
                            ...prev,
                            bandwidthName: "existing-vpc",
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-black"
                      />
                      <div>
                        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                          <span className="text-green-600">✅</span>
                          Use existing VPC
                        </div>
                        <div className="text-sm text-slate-500">
                          Select from available VPCs
                        </div>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="radio"
                        name="vpc-mode"
                        checked={data.bandwidthName !== "existing-vpc"}
                        onChange={() =>
                          setData((prev) => ({
                            ...prev,
                            bandwidthName: "",
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-black"
                      />
                      <div>
                        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                          <PlusCircle className="h-4 w-4" />
                          Create new VPC
                        </div>
                        <div className="text-sm text-slate-500">
                          Configure a new VPC
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  VPC and subnet fields are currently UI-only in this step. They can be added
                  to the global context in the next refinement if you want to persist them too.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => router.push("/build-vm/storage")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                onClick={() => router.push("/build-vm/region")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
              >
                Next: Region
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