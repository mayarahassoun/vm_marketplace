"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, HardDrive, Plus, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import BuildVMSteps from "../BuildVMSteps"

export default function BuildVMStoragePage() {
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
            href="/build-vm/os"
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
            <BuildVMSteps active="Storage" />

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-blue-500" />
                    <h2 className="text-2xl font-semibold text-slate-900">System Disk</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Configure your primary system disk
                  </p>
                </div>

                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-800">
                      Storage Size
                    </label>
                    <span className="text-lg font-semibold text-slate-900">
                      {data.storageSize} GB
                    </span>
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="2000"
                    step="20"
                    value={data.storageSize}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storageSize: Number(e.target.value),
                        storagePrice: Number(e.target.value) >= 100 ? 10 : 5,
                      }))
                    }
                    className="w-full accent-black"
                  />

                  <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                    <span>20 GB</span>
                    <span>2000 GB</span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-800">
                    Storage Type
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="radio"
                        name="storage-type"
                        checked={data.storageType === "SSD"}
                        onChange={() =>
                          setData((prev) => ({
                            ...prev,
                            storageType: "SSD",
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-black"
                      />
                      <div>
                        <div className="text-lg font-semibold text-slate-900">SSD</div>
                        <div className="text-sm text-slate-500">Standard performance</div>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <input
                        type="radio"
                        name="storage-type"
                        checked={data.storageType === "Business_SSD"}
                        onChange={() =>
                          setData((prev) => ({
                            ...prev,
                            storageType: "Business_SSD",
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-black"
                      />
                      <div>
                        <div className="text-lg font-semibold text-slate-900">
                          Business_SSD
                        </div>
                        <div className="text-sm text-slate-500">High performance</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-blue-500" />
                    <h2 className="text-2xl font-semibold text-slate-900">Data Disks</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Add additional data disks to your VM
                  </p>
                </div>

                <div className="space-y-4">
                  {data.additionalDisks.map((disk) => (
                    <div
                      key={disk.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4"
                    >
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{disk.label}</div>
                        <div className="text-sm text-slate-500">${disk.price}/mo</div>
                      </div>

                      <button
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            additionalDisks: prev.additionalDisks.filter(
                              (item) => item.id !== disk.id
                            ),
                          }))
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      additionalDisks: [
                        ...prev.additionalDisks,
                        {
                          id: Date.now(),
                          label: "100 GB SSD",
                          price: 10,
                        },
                      ],
                    }))
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-slate-900"
                >
                  <Plus className="h-4 w-4" />
                  Add Data Disk
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => router.push("/build-vm/os")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                onClick={() => router.push("/build-vm/network")}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
              >
                Next: Network
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
