"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Server,
  Monitor,
  HardDrive,
  Globe,
  Network,
  FileText,
  CreditCard,
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

export default function BuildVMReviewPage() {
  const router = useRouter()
  const { data } = useBuildVM()

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
            href="/build-vm/details"
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
                const isActive = index === 7
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

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-3xl font-semibold text-slate-900">
                VM Configuration Summary
              </h2>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-slate-400">Instance Type</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{data.instanceName}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {data.instanceCpu}, {data.instanceRam}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">Storage</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <HardDrive className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">
                        {data.storageSize} GB {data.storageType}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      + {data.additionalDisks.length} additional disk(s)
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">Region</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{data.regionLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-slate-400">Operating System</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{data.os}</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">Network</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Network className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">
                        {data.bandwidthSize} Mbps ({data.bandwidthType})
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">VM Name</div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{data.vmName}</span>
                    </div>
                    {data.description && (
                      <div className="mt-1 text-sm text-slate-500">{data.description}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Additional Disks</span>
                  <span className="font-medium text-slate-900">${additionalDisksTotal}/mo</span>
                </div>

                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {data.additionalDisks.map((disk) => (
                    <div key={disk.id}>{disk.label}</div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => router.push("/build-vm/details")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-semibold text-slate-900">Ready to Deploy?</h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Your custom VM is configured and ready to deploy. Click the button
                below to proceed to payment and deployment.
              </p>

              <button
  onClick={() => router.push("/build-vm/payment")}
  className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-slate-900"
>
  Pay Now
</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}