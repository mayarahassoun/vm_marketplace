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
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import { getAuthToken } from "@/lib/api"

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

  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

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

  function handleDeploy() {
    if (!confirmed) {
      setError("Please confirm that the VM configuration is correct before continuing.")
      return
    }

    const token = getAuthToken()

    if (!token) {
      router.push("/login")
      return
    }

    router.push("/build-vm/payment")
  }

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
            Review your VM configuration carefully before continuing to payment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-6 inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-medium transition",
                    index === 7
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  {step}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    VM Configuration Summary
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This is the final summary of your virtual machine. The password
                    is not displayed for security reasons.
                  </p>
                </div>

                <div className="hidden rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 md:block">
                  Ready for payment
                </div>
              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-slate-400">
                      Instance Type
                    </div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">
                        {data.instanceName || "Not selected"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {data.instanceCpu || "CPU not selected"},{" "}
                      {data.instanceRam || "RAM not selected"}
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
                      <span className="font-semibold">
                        {data.regionLabel || data.region || "Not selected"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">
                      VPC / Subnet
                    </div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Network className="h-4 w-4 text-violet-500" />
                      <span className="font-semibold">
                        {data.vpcMode === "existing"
                          ? `Existing VPC — ${
                              data.subnetId || "no subnet selected"
                            }`
                          : `New VPC — ${data.vpcName || "unnamed"} (${
                              data.vpcCidr || "no CIDR"
                            })`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-slate-400">
                      Operating System
                    </div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">
                        {data.osName || "Not selected"}
                      </span>
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
                      <span className="font-semibold">
                        {data.vmName || "Not defined"}
                      </span>
                    </div>

                    {data.description && (
                      <div className="mt-1 text-sm text-slate-500">
                        {data.description}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">
                      Authentication
                    </div>
                    <div className="flex items-center gap-2 text-slate-900">
                      <LockKeyhole className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">
                        Password configured
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      The password is hidden for security reasons.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Additional Disks</span>
                  <span className="font-medium text-slate-900">
                    ${additionalDisksTotal}/mo
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {data.additionalDisks.length > 0 ? (
                    data.additionalDisks.map((disk) => (
                      <div key={disk.id}>{disk.label}</div>
                    ))
                  ) : (
                    <div>No additional disks selected</div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
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
              <h2 className="text-3xl font-semibold text-slate-900">
                Pricing Summary
              </h2>

              <div className="mt-8 space-y-4 text-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Instance ({data.instanceName})
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${data.instancePrice}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Storage ({data.storageSize} GB {data.storageType})
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${data.storagePrice}/mo
                  </span>
                </div>

                {additionalDisksTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Additional {data.additionalDisks.length} disk(s)
                    </span>
                    <span className="font-medium text-slate-700">
                      ${additionalDisksTotal}/mo
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Network ({data.bandwidthSize} Mbps)
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${data.networkPrice}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Region ({data.region})
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${data.regionPrice}/mo
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-slate-200" />

              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-slate-900">
                  Total
                </span>
                <span className="text-3xl font-semibold text-slate-900">
                  ${total}/mo
                </span>
              </div>

              <p className="mt-6 text-sm leading-6 text-slate-500">
                Prices are shown in USD and billed monthly. Additional taxes may
                apply depending on your location.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    Ready for Checkout?
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Confirm your VM configuration before payment.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Configuration summary
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your VM name, operating system, storage, network and region
                      are ready. Payment will be required before final
                      provisioning.
                    </p>
                  </div>
                </div>
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked)

                    if (e.target.checked) {
                      setError(null)
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                />

                <span className="text-sm leading-6 text-slate-600">
                  I confirm that this VM configuration is correct and I want to
                  continue to the secure payment step.
                </span>
              </label>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleDeploy}
                disabled={!confirmed}
                className={[
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
                  confirmed
                    ? "bg-black text-white hover:bg-slate-900"
                    : "cursor-not-allowed bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                <CreditCard className="h-4 w-4" />
                {confirmed
                  ? "Proceed to Secure Payment"
                  : "Confirm configuration to continue"}
              </button>

              <p className="mt-4 text-center text-xs text-slate-400">
                You will be redirected to the payment page. No VM will be
                deployed before payment confirmation.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
