"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Globe } from "lucide-react"
import { useMemo } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import BuildVMSteps from "../BuildVMSteps"

const regions = [
  {
    id: "tn-global-1",
    label: "tn-global-1 (Tunisia)",
    price: 10,
  },
  {
    id: "tn-global-2",
    label: "tn-global-2 (Ariana)",
    price: 15,
  },
]

export default function BuildVMRegionPage() {
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
            href="/build-vm/network"
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
            <BuildVMSteps active="Region" />

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Region</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a geographic region for your VM
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {regions.map((region) => (
                  <label
                    key={region.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <input
                      type="radio"
                      name="region"
                      checked={data.region === region.id}
                      onChange={() =>
                        setData((prev) => ({
                          ...prev,
                          region: region.id,
                          regionLabel: region.label,
                          regionPrice: region.price,
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-black"
                    />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {region.id}
                      </div>
                      <div className="text-sm text-slate-500">
                        {region.label} (+${region.price}/mo)
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => router.push("/build-vm/network")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                onClick={() => router.push("/build-vm/details")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
              >
                Next: Details
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
