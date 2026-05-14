"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Boxes,
  ChevronRight,
  Cpu,
  HardDrive,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react"
import AppLogo from "@/components/AppLogo"

const osOptions = [
  { id: "ubuntu-22", name: "Ubuntu Server 22", minDisk: 30 },
  { id: "ubuntu-24", name: "Ubuntu Server 24", minDisk: 10 },
  { id: "debian-10", name: "Debian 10", minDisk: 10 },
  { id: "debian-11", name: "Debian 11", minDisk: 40 },
]

const flavorOptions = [
  { id: "s6.medium.2", cpu: "1 vCPU", ram: "2 GB RAM", price: 10 },
  { id: "s6.large.2", cpu: "2 vCPU", ram: "4 GB RAM", price: 20 },
]

const clusterProfiles = [
  "E-learning mini cluster",
  "Research lab cluster",
  "Web application cluster",
  "Training environment",
]

export default function BuildClusterPage() {
  const [clusterName, setClusterName] = useState("cck-demo-cluster")
  const [profile, setProfile] = useState(clusterProfiles[0])
  const [osId, setOsId] = useState(osOptions[0].id)
  const [flavorId, setFlavorId] = useState(flavorOptions[0].id)
  const [networkMode, setNetworkMode] = useState("Existing VPC / subnet")

  const selectedOs = osOptions.find((item) => item.id === osId) ?? osOptions[0]
  const selectedFlavor =
    flavorOptions.find((item) => item.id === flavorId) ?? flavorOptions[0]

  const nodes = useMemo(
    () => [
      {
        id: 1,
        name: `${clusterName || "cluster"}-node-1`,
        role: "Application node",
      },
      {
        id: 2,
        name: `${clusterName || "cluster"}-node-2`,
        role: "Worker / service node",
      },
    ],
    [clusterName]
  )

  const monthlyTotal = selectedFlavor.price * nodes.length

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <AppLogo />

          <div className="hidden items-center gap-10 text-sm font-medium text-slate-700 md:flex">
            <Link href="/marketplace" className="hover:text-slate-900">
              Marketplace
            </Link>
            <Link href="/build-vm/instance" className="hover:text-slate-900">
              Build VM
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
          </div>

          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            UI preview
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/marketplace"
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Mini VM Cluster
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-500">
                Prepare a quota-aware two-node cluster for academic workloads,
                labs and PFE demonstrations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                Cluster size
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                2 nodes
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <Boxes className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="text-2xl font-semibold">Cluster settings</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The first version keeps the cluster intentionally small to
                    respect cloud quota limits.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Cluster name
                  </span>
                  <input
                    value={clusterName}
                    onChange={(event) => setClusterName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Use case
                  </span>
                  <select
                    value={profile}
                    onChange={(event) => setProfile(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {clusterProfiles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Operating system
                  </span>
                  <select
                    value={osId}
                    onChange={(event) => setOsId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {osOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Node flavor
                  </span>
                  <select
                    value={flavorId}
                    onChange={(event) => setFlavorId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    {flavorOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} - {item.cpu} / {item.ram}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Network placement
                  </span>
                  <select
                    value={networkMode}
                    onChange={(event) => setNetworkMode(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  >
                    <option>Existing VPC / subnet</option>
                    <option>New VPC for cluster</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="text-2xl font-semibold">Cluster nodes</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Node names are generated automatically from the cluster name.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {node.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {node.role}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        Node {node.id}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-slate-400" />
                        {selectedFlavor.cpu} / {selectedFlavor.ram}
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-slate-400" />
                        {selectedOs.minDisk} GB minimum system disk
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-slate-400" />
                        {networkMode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-semibold">Cluster summary</h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Use case</span>
                  <span className="text-right font-medium text-slate-900">
                    {profile}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">OS</span>
                  <span className="font-medium text-slate-900">
                    {selectedOs.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Flavor</span>
                  <span className="font-medium text-slate-900">
                    {selectedFlavor.id}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Estimated cost</span>
                  <span className="font-semibold text-slate-900">
                    ${monthlyTotal}/mo
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Quota-aware design
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This UI prepares a two-node cluster plan without launching
                    cloud resources yet. Automation can later create both VMs in
                    the same VPC and install monitoring per node.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
              disabled
            >
              Automation planned
              <ChevronRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}
