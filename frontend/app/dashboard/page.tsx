"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  Bell, Settings, MoreHorizontal, RotateCcw,
  BarChart3, Terminal, Trash2, Server, Activity,
  CreditCard, Cpu, HardDrive, Power, Boxes, Network,
} from "lucide-react"
import { clearAuthToken, getAuthToken, listVMs, deleteVM as deleteVMApi } from "@/lib/api"
import SSHPasswordModal from "@/components/SSHPasswordModal"
import Link from "next/link"

type VM = {
  id: number
  name: string
  image: string
  status: string
  created: string
  region: string
  ip: string
  flavor_id: string
  system_disk_size: number
  netdata_url: string | null
}

type BackendVM = {
  id: number
  instance_name: string
  image_id: string
  status: string
  created_at: string
  availability_zone: string
  private_ip: string | null
  public_ip: string | null
  flavor_id: string
  system_disk_size: number
  netdata_url: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [vmToDelete, setVmToDelete] = useState<number | null>(null)
  const [vms, setVms] = useState<VM[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sshTarget, setSshTarget] = useState<{ ip: string; name: string } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function fetchVMs() {
      try {
        const token = getAuthToken()
        if (!token) {
          router.push("/auth/login")
          return
        }

        const data = (await listVMs(token)) as BackendVM[]
        setVms(
          data.map((vm) => ({
            id: vm.id,
            name: vm.instance_name,
            image: vm.image_id,
            status: vm.status,
            created: new Date(vm.created_at).toLocaleDateString(),
            region: vm.availability_zone,
            ip: vm.private_ip || vm.public_ip || "N/A",
            flavor_id: vm.flavor_id,
            system_disk_size: vm.system_disk_size,
            netdata_url: vm.netdata_url,
          }))
        )
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          clearAuthToken()
          router.push("/auth/login")
          return
        }
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchVMs()
  }, [router])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function getStatusStyle(status: string) {
    switch (status) {
      case "running": return "bg-green-100 text-green-700"
      case "starting": return "bg-yellow-100 text-yellow-700"
      case "stopped": return "bg-red-100 text-red-700"
      default: return "bg-slate-100 text-slate-600"
    }
  }

  function handlePowerToggle(vmId: number) {
    setVms((prev) =>
      prev.map((vm) => {
        if (vm.id !== vmId) return vm
        if (vm.status === "starting") return vm
        return { ...vm, status: vm.status === "running" ? "stopped" : "running" }
      })
    )
  }

  function handleRestart(vmId: number) {
    const target = vms.find((vm) => vm.id === vmId)
    if (!target || target.status !== "running") return
    setVms((prev) =>
      prev.map((vm) => vm.id === vmId ? { ...vm, status: "starting" } : vm)
    )
    setTimeout(() => {
      setVms((prev) =>
        prev.map((vm) => vm.id === vmId ? { ...vm, status: "running" } : vm)
      )
    }, 2000)
  }

  const runningCount = vms.filter((v) => v.status === "running").length

  return (
    <div className="min-h-screen px-8 py-8">

      {/* Top bar */}
      <div className="mb-8 flex items-center justify-end border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 hover:bg-slate-100">
            <Bell className="h-5 w-5 text-slate-500 hover:text-slate-800" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="flex items-center gap-3">
  <button
    onClick={() => {
      clearAuthToken()
      router.push("/auth/login")
    }}
    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Logout
  </button>
  <div className="h-9 w-9 rounded-full bg-slate-200" />
</div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-2 text-lg text-slate-500">
            Manage your virtual machines and monitor usage
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => router.push("/marketplace")}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
          >
            Deploy New VM
          </button>
          <Link
            href="/ai-recommendation"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            AI Recommendation
          </Link>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active VMs</p>
          <h3 className="mt-3 text-4xl font-semibold text-slate-900">{runningCount}</h3>
          <p className="mt-2 text-sm text-slate-400">Total {vms.length} VMs</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Monthly Cost</p>
          <h3 className="mt-3 text-4xl font-semibold text-slate-900">$50</h3>
          <p className="mt-2 text-sm text-slate-400">Current month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Uptime</p>
          <h3 className="mt-3 text-4xl font-semibold text-slate-900">99.9%</h3>
          <p className="mt-2 text-sm text-slate-400">Last 30 days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Next Billing</p>
          <h3 className="mt-3 text-4xl font-semibold text-slate-900">15 Days</h3>
          <p className="mt-2 text-sm text-slate-400">Nov 18, 2025</p>
        </div>
      </div>

      {/* Planned clusters */}
      <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <Boxes className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  Planned Clusters
                </h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  UI-only
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Prepare quota-aware multi-node deployments before connecting the
                backend automation.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/build-cluster")}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Configure Cluster
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-400">
              Cluster
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              cck-demo-cluster
            </p>
            <p className="mt-1 text-sm text-slate-500">Status: Planned</p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-400">
              Nodes
            </p>
            <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
              <Server className="h-4 w-4 text-slate-400" />
              2 VM nodes
            </div>
            <p className="mt-1 text-sm text-slate-500">s6.medium.2 baseline</p>
          </div>

          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-400">
              Network
            </p>
            <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
              <Network className="h-4 w-4 text-slate-400" />
              Same VPC / subnet
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Monitoring planned per node
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm">
          <Server className="h-4 w-4" />
          My VMs
        </button>
        <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-900">
          <Activity className="h-4 w-4" />
          Usage
        </button>
        <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-900">
          <CreditCard className="h-4 w-4" />
          Billing
        </button>
      </div>

      {/* Table */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-5 border-b border-slate-200 px-6 py-4 text-sm font-medium uppercase tracking-wide text-slate-400">
          <div>Name / Image</div>
          <div>Status</div>
          <div>Specs</div>
          <div>Region / IP</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading your VMs...</div>
        ) : vms.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No VMs yet.{" "}
            <button
              onClick={() => router.push("/marketplace")}
              className="text-blue-600 hover:underline"
            >
              Deploy your first VM
            </button>
          </div>
        ) : (
          vms.map((vm) => (
            <div
              key={vm.id}
              className="grid grid-cols-5 items-center border-t border-slate-200 px-6 py-6 text-sm text-slate-700"
            >
              {/* Name */}
              <div>
                <p className="font-semibold text-slate-900">{vm.name}</p>
                <p className="mt-1 text-slate-500">{vm.image}</p>
              </div>

              {/* Status */}
              <div className="flex flex-col">
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(vm.status)}`}>
                  <span className={`h-2 w-2 rounded-full ${
                    vm.status === "running" ? "animate-pulse bg-green-500" :
                    vm.status === "starting" ? "bg-yellow-500" :
                    vm.status === "stopped" ? "bg-red-500" : "bg-slate-400"
                  }`} />
                  {vm.status}
                </span>
                <p className="mt-2 text-slate-400">Created: {vm.created}</p>
              </div>

              {/* Specs */}
              <div className="space-y-1 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-slate-400" />
                  <span>{vm.flavor_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-slate-400" />
                  <span>{vm.system_disk_size} GB</span>
                </div>
              </div>

              {/* Region / IP */}
              <div className="text-slate-500">
                <p>{vm.region}</p>
                <p>{vm.ip}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePowerToggle(vm.id)}
                  disabled={vm.status === "starting"}
                  className={`rounded-lg border p-2 ${
                    vm.status === "starting"
                      ? "cursor-not-allowed border-slate-200 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                  title={vm.status === "running" ? "Stop VM" : "Start VM"}
                >
                  <Power className={`h-4 w-4 ${
                    vm.status === "running" ? "text-green-600" :
                    vm.status === "stopped" ? "text-red-600" : "text-slate-400"
                  }`} />
                </button>

                <button
                  onClick={() => handleRestart(vm.id)}
                  disabled={vm.status !== "running"}
                  className={`rounded-lg border p-2 ${
                    vm.status === "running"
                      ? "border-slate-200 hover:bg-slate-50"
                      : "cursor-not-allowed border-slate-200 bg-slate-50"
                  }`}
                  title="Restart VM"
                >
                  <RotateCcw className={`h-4 w-4 ${
                    vm.status === "running" ? "text-slate-600" : "text-slate-400"
                  }`} />
                </button>

                <div className="relative" ref={openMenu === vm.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenu(openMenu === vm.id ? null : vm.id)}
                    className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                  >
                    <MoreHorizontal className="h-4 w-4 text-slate-600" />
                  </button>

                  {openMenu === vm.id && (
                    <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <button
                        onClick={() => {
                          if (vm.netdata_url) {
                            router.push(`/monitoring?vm_id=${vm.id}&name=${encodeURIComponent(vm.name)}`)
                          }
                        }}
                        disabled={!vm.netdata_url}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                          vm.netdata_url
                            ? "text-slate-700 hover:bg-slate-50"
                            : "cursor-not-allowed text-slate-300"
                        }`}
                      >
                        <BarChart3 className="h-4 w-4" />
                        {vm.netdata_url ? "Monitoring" : "Monitoring (installing...)"}
                      </button>

                      <button
                        onClick={() => setSshTarget({ ip: vm.ip, name: vm.name })}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Terminal className="h-4 w-4" />
                        SSH Console
                      </button>

                      <button
                        onClick={() => { setVmToDelete(vm.id); setOpenMenu(null) }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete VM
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SSH Modal */}
      {sshTarget && (
        <SSHPasswordModal
          vmName={sshTarget.name}
          vmIp={sshTarget.ip}
          onClose={() => setSshTarget(null)}
          onConfirm={(password) => {
            setSshTarget(null)
            router.push(
              `/ssh?host=${sshTarget.ip}&password=${encodeURIComponent(password)}&name=${encodeURIComponent(sshTarget.name)}`
            )
          }}
        />
      )}

      {/* Delete Modal */}
      {vmToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Delete Virtual Machine</h2>
            <p className="mt-3 text-sm text-slate-500">
              Are you sure you want to delete this VM? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setVmToDelete(null); setDeleteError(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={async () => {
                  if (vmToDelete === null) return
                  setDeleteLoading(true)
                  setDeleteError(null)
                  try {
                    const token = getAuthToken()
                    if (!token) { router.push("/auth/login"); return }
                    await deleteVMApi(token, vmToDelete)
                    setVms((prev) => prev.filter((vm) => vm.id !== vmToDelete))
                    setVmToDelete(null)
                  } catch (e: unknown) {
                    setDeleteError(e instanceof Error ? e.message : "Failed to delete VM")
                  } finally {
                    setDeleteLoading(false)
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
