"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Monitor } from "lucide-react"
import { useMemo, useState } from "react"
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

const linuxOptions = [
  "AlmaLinux-8",
  "AlmaLinux-9",
  "Debian-10",
  "Debian-11",
  "Debian-8",
  "Debian-9",
  "Rocky-8",
  "Rocky-9",
  "Ubuntu-Server-16",
  "Ubuntu-Server-18",
  "Ubuntu-Server-20",
  "Ubuntu-Server-24",
]

const windowsOptions = ["Windows Server 2019", "Windows Server 2022"]
const otherOptions = ["FreeBSD", "OpenSUSE", "Oracle Linux"]

export default function BuildVMOSPage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const [tab, setTab] = useState<"Linux" | "Windows" | "Other">("Linux")
  const [search, setSearch] = useState("")

  const options = useMemo(() => {
    const source =
      tab === "Linux" ? linuxOptions : tab === "Windows" ? windowsOptions : otherOptions

    return source.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    )
  }, [tab, search])

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
      {/* top nav */}
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
        {/* header */}
        <div className="mb-8">
          <Link
            href="/build-vm/instance"
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
          {/* left */}
          <div>
            {/* stepper */}
            <div className="mb-6 inline-flex flex-wrap rounded-xl bg-slate-100 p-1">
              {steps.map((step, index) => {
                const isActive = index === 1
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

            {/* OS card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Operating System
                  </h2>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Select an operating system for your VM
                </p>
              </div>

              {/* tabs */}
              <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-100 p-1">
                {(["Linux", "Windows", "Other"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setTab(item)}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium transition",
                      tab === item
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* search */}
              <input
                placeholder={`Search ${tab} distributions...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />

              {/* options */}
              <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                {options.map((os) => (
                  <label key={os} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="os"
                      checked={data.os === os}
                      onChange={() =>
                        setData((prev) => ({
                          ...prev,
                          os,
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-black"
                    />
                    <div>
                      <div className="text-lg font-semibold text-slate-900">{os}</div>
                      <div className="text-sm text-slate-500">Free</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* nav buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => router.push("/build-vm/instance")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                onClick={() => router.push("/build-vm/storage")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
              >
                Next: Storage
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* right summary */}
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