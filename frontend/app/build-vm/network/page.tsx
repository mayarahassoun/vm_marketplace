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
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import BuildVMSteps from "../BuildVMSteps"

export default function BuildVMNetworkPage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const total =
    data.instancePrice +
    data.storagePrice +
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
            <BuildVMSteps active="Network" />

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

              {/* VPC & Subnet Configuration */}
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

  {/* Toggle existing / new */}
  <div className="mb-6 grid gap-4 md:grid-cols-2">
    <label className={[
      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
      data.vpcMode === "existing"
        ? "border-black bg-slate-50"
        : "border-slate-200"
    ].join(" ")}>
      <input
        type="radio"
        name="vpc-mode"
        checked={data.vpcMode === "existing"}
        onChange={() => setData((prev) => ({ ...prev, vpcMode: "existing" }))}
        className="mt-1 h-4 w-4 accent-black"
      />
      <div>
        <div className="text-lg font-semibold text-slate-900">
          Use existing VPC
        </div>
        <div className="text-sm text-slate-500">Select from available VPCs</div>
      </div>
    </label>

    <label className={[
      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
      data.vpcMode === "new"
        ? "border-black bg-slate-50"
        : "border-slate-200"
    ].join(" ")}>
      <input
        type="radio"
        name="vpc-mode"
        checked={data.vpcMode === "new"}
        onChange={() => setData((prev) => ({ ...prev, vpcMode: "new" }))}
        className="mt-1 h-4 w-4 accent-black"
      />
      <div>
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <PlusCircle className="h-4 w-4" />
          Create new VPC
        </div>
        <div className="text-sm text-slate-500">Configure a new VPC</div>
      </div>
    </label>
  </div>

  {/* Existing VPC */}
  {data.vpcMode === "existing" && (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">
          VPC
        </label>
        <select
          value={data.vpcId}
          onChange={(e) => setData((prev) => ({ ...prev, vpcId: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        >
          <option value="">Select a VPC</option>
          <option value="241ee334-1b48-41d3-8xxx">Marketplace-vpc1 (192.168.0.0/16)</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">
          Subnet
        </label>
        <select
          value={data.subnetId}
          onChange={(e) => setData((prev) => ({ ...prev, subnetId: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          disabled={!data.vpcId}
        >
          <option value="">Select a subnet</option>
          <option value="8007e0d2-351e-480b-bb10-428e879ce6a8">subnet-15d6 (192.168.5.0/24)</option>
          <option value="490c9b38-c948-45da-abe3-c9e11466ddfc">subnet_demo_1 (192.168.128.0/24)</option>
          <option value="38f9a0fd-8db2-4617-9b79-fc53f9f4156d">subnet_demo_2 (192.168.129.0/24)</option>
          <option value="b130ed1f-5413-4265-879d-6d1da4f5f072">subnet_demo_3 (192.168.130.0/24)</option>
        </select>
      </div>
    </div>
  )}

  {/* New VPC */}
  {data.vpcMode === "new" && (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            VPC Name
          </label>
          <input
            value={data.vpcName}
            onChange={(e) => setData((prev) => ({ ...prev, vpcName: e.target.value }))}
            placeholder="e.g. MyVpc"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800">
            VPC CIDR Block
          </label>
          <input
            value={data.vpcCidr}
            onChange={(e) => setData((prev) => ({ ...prev, vpcCidr: e.target.value }))}
            placeholder="e.g. 192.168.0.0/16"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-4 text-sm font-medium text-slate-700">Subnet Settings</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Subnet Name
            </label>
            <input
              value={data.subnetName}
              onChange={(e) => setData((prev) => ({ ...prev, subnetName: e.target.value }))}
              placeholder="e.g. subnet-default"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Subnet CIDR
            </label>
            <input
              value={data.subnetCidr}
              onChange={(e) => setData((prev) => ({ ...prev, subnetCidr: e.target.value }))}
              placeholder="e.g. 192.168.1.0/24"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Gateway IP
            </label>
            <input
              value={data.gatewayIp}
              onChange={(e) => setData((prev) => ({ ...prev, gatewayIp: e.target.value }))}
              placeholder="e.g. 192.168.1.1"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Primary DNS
            </label>
            <input
              value={data.primaryDns}
              onChange={(e) => setData((prev) => ({ ...prev, primaryDns: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Secondary DNS
            </label>
            <input
              value={data.secondaryDns}
              onChange={(e) => setData((prev) => ({ ...prev, secondaryDns: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </div>
      </div>

      {/* VPC price in summary */}
      {data.vpcName && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          A new VPC <strong>{data.vpcName}</strong> will be created with CIDR{" "}
          <strong>{data.vpcCidr || "not set"}</strong>
        </div>
      )}
    </div>
  )}
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
