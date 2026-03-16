"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  Bell,
  Settings,
  MoreHorizontal,
  RotateCcw,
  BarChart3,
  Terminal,
  Trash2,
  Server,
  Activity,
  CreditCard,
  Cpu,
  MemoryStick,
  HardDrive,
  Power,
} from "lucide-react"

type VMStatus = "running" | "starting" | "stopped"

type VM = {
  id: number
  name: string
  image: string
  status: VMStatus
  created: string
  region: string
  ip: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [deleteVM, setDeleteVM] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [vms, setVms] = useState<VM[]>([
    {
      id: 1,
      name: "montez",
      image: "Ubuntu-Server-24",
      status: "running",
      created: "9/15/2025",
      region: "tn-global-1",
      ip: "193.95.31.218",
    },
    {
      id: 2,
      name: "monday",
      image: "Debian-11",
      status: "starting",
      created: "10/27/2025",
      region: "tn-global-1",
      ip: "193.95.30.24",
    },
  ])

  function getStatusStyle(status: string) {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-700"
      case "starting":
        return "bg-yellow-100 text-yellow-700"
      case "stopped":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-600"
    }
  }

  function handlePowerToggle(vmId: number) {
    setVms((prev) =>
      prev.map((vm) => {
        if (vm.id !== vmId) return vm
        if (vm.status === "starting") return vm
        return {
          ...vm,
          status: vm.status === "running" ? "stopped" : "running",
        }
      })
    )
  }

  function handleRestart(vmId: number) {
    const target = vms.find((vm) => vm.id === vmId)
    if (!target || target.status !== "running") return

    setVms((prev) =>
      prev.map((vm) =>
        vm.id === vmId ? { ...vm, status: "starting" } : vm
      )
    )

    setTimeout(() => {
      setVms((prev) =>
        prev.map((vm) =>
          vm.id === vmId ? { ...vm, status: "running" } : vm
        )
      )
    }, 2000)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="mb-8 flex items-center justify-end border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 hover:bg-slate-100">
            <Bell className="h-5 w-5 text-slate-500 hover:text-slate-800" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="h-9 w-9 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Manage your virtual machines and monitor usage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/marketplace")}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
          >
            + Deploy New VM
          </button>

          <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active VMs</p>
          <h3 className="mt-3 text-4xl font-semibold text-slate-900">{vms.length}</h3>
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

      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-5 border-b border-slate-200 px-6 py-4 text-sm font-medium uppercase tracking-wide text-slate-400">
          <div>Name / Image</div>
          <div>Status</div>
          <div>Specs</div>
          <div>Region / IP</div>
          <div>Actions</div>
        </div>

        {vms.map((vm) => (
          <div
            key={vm.id}
            className="grid grid-cols-5 items-center border-t border-slate-200 px-6 py-6 text-sm text-slate-700"
          >
            <div>
              <p className="font-semibold text-slate-900">{vm.name}</p>
              <p className="mt-1 text-slate-500">{vm.image}</p>
            </div>

            <div className="flex flex-col">
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(vm.status)}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    vm.status === "running"
                      ? "bg-green-500 animate-pulse"
                      : vm.status === "starting"
                      ? "bg-yellow-500"
                      : vm.status === "stopped"
                      ? "bg-red-500"
                      : "bg-slate-400"
                  }`}
                />
                {vm.status}
              </span>

              <p className="mt-2 text-slate-400">Created: {vm.created}</p>
            </div>

            <div className="space-y-1 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-slate-400" />
                <span>1 vCPU</span>
              </div>

              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-slate-400" />
                <span>2 GB</span>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-slate-400" />
                <span>100 GB</span>
              </div>
            </div>

            <div className="text-slate-500">
              <p>{vm.region}</p>
              <p>{vm.ip}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePowerToggle(vm.id)}
                disabled={vm.status === "starting"}
                className={`rounded-lg border p-2 ${
                  vm.status === "starting"
                    ? "cursor-not-allowed border-slate-200 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                title={
                  vm.status === "running"
                    ? "Stop VM"
                    : vm.status === "stopped"
                    ? "Start VM"
                    : "Action unavailable while starting"
                }
              >
                <Power
                  className={`h-4 w-4 ${
                    vm.status === "running"
                      ? "text-green-600"
                      : vm.status === "stopped"
                      ? "text-red-600"
                      : "text-slate-400"
                  }`}
                />
              </button>

              <button
                onClick={() => handleRestart(vm.id)}
                disabled={vm.status !== "running"}
                className={`rounded-lg border p-2 ${
                  vm.status === "running"
                    ? "border-slate-200 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50"
                }`}
                title={
                  vm.status === "running"
                    ? "Restart VM"
                    : "Restart available only when VM is running"
                }
              >
                <RotateCcw
                  className={`h-4 w-4 ${
                    vm.status === "running" ? "text-slate-600" : "text-slate-400"
                  }`}
                />
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
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      <BarChart3 className="h-4 w-4" />
                      Monitoring
                    </button>

                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      <Terminal className="h-4 w-4" />
                      SSH Console
                    </button>

                    <button
                      onClick={() => {
                        setDeleteVM(vm.id)
                        setOpenMenu(null)
                      }}
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
        ))}
      </div>

      {deleteVM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Delete Virtual Machine
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Are you sure you want to delete this VM? This action cannot be
              undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteVM(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setVms((prev) => prev.filter((vm) => vm.id !== deleteVM))
                  setDeleteVM(null)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}