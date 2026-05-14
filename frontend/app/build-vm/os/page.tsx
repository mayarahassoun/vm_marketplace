"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Monitor } from "lucide-react"
import { useMemo, useState } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import { VM_IMAGES, type VMImage } from "@/lib/api"
import BuildVMSteps from "../BuildVMSteps"

const osFamilies: VMImage["distro"][] = ["Ubuntu", "Debian", "Other", "Windows"]

const getStoragePrice = (size: number) => (size >= 100 ? 10 : 5)

export default function BuildVMOSPage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const [tab, setTab] = useState<VMImage["distro"]>("Ubuntu")
  const [search, setSearch] = useState("")

  const options = useMemo(() => {
    return VM_IMAGES.filter((img) => {
      const matchTab = img.distro === tab
      const matchSearch = img.name.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [tab, search])

  const additionalDisksTotal = data.additionalDisks.reduce(
    (sum, disk) => sum + disk.price, 0
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
            <Link href="/marketplace" className="hover:text-slate-900">Marketplace</Link>
            <button className="hover:text-slate-900">Pricing</button>
            <button className="hover:text-slate-900">Documentation</button>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
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
            your exact requirements.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <BuildVMSteps active="OS" />

            {/* OS Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Operating System
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select an operating system for your VM
                  </p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-100 p-1 xl:grid-cols-4">
                {osFamilies.map((item) => (
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

              {/* Search */}
              <input
                placeholder={`Search ${tab} images...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              <p className="-mt-3 mb-6 text-sm text-slate-500">
                Le disque systeme sera ajuste automatiquement si l&apos;image exige un minimum superieur.
              </p>

              {/* Liste des images */}
              <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                {options.map((img) => {
                  const isReady = img.status !== "needs_id" && Boolean(img.id)

                  return (
                  <label
                    key={`${img.distro}-${img.name}`}
                    className={[
                      "flex items-start gap-3 rounded-xl border p-4 transition",
                      isReady
                        ? "cursor-pointer border-slate-200 hover:bg-slate-50"
                        : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70",
                      data.os === img.id && isReady ? "border-black bg-white" : "",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="os"
                      checked={data.os === img.id && isReady}
                      disabled={!isReady}
                      onChange={() =>
                        setData((prev) => {
                          return {
                            ...prev,
                            os: img.id,
                            osName: img.name,
                            storageSize: img.minDisk,
                            storagePrice: getStoragePrice(img.minDisk),
                          }
                        })
                      }
                      className="mt-1 h-4 w-4 accent-black"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-slate-900">
                          {img.name}
                        </span>
                        {!isReady && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            UUID requis
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        Min {img.minDisk} GB disk · {img.minRam} GB RAM · Free
                      </div>
                      {!isReady && (
                        <div className="mt-1 text-xs text-slate-400">
                          Visible dans la console HCS, mais non deployable tant que son UUID n&apos;est pas ajoute.
                        </div>
                      )}
                    </div>
                  </label>
                  )
                })}

                {options.length === 0 && (
                  <p className="col-span-2 text-sm text-slate-400">
                    No images found for &quot;{search}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Navigation */}
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

          {/* Pricing Summary */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold text-slate-900">Pricing Summary</h2>
            <div className="mt-8 space-y-4 text-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Instance ({data.instanceName})</span>
                <span className="font-semibold text-slate-900">${data.instancePrice}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Storage ({data.storageSize} GB {data.storageType})</span>
                <span className="font-semibold text-slate-900">${data.storagePrice}/mo</span>
              </div>
              {additionalDisksTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Additional {data.additionalDisks.length} disk(s)</span>
                  <span className="font-medium text-slate-700">${additionalDisksTotal}/mo</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Network ({data.bandwidthSize} Mbps)</span>
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
              Prices are shown in USD and billed monthly.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
