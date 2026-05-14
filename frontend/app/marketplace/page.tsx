"use client"

import { Search, Filter, SlidersHorizontal, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

const vmTemplates = [
  {
    id: 1,
    name: "University Web Portal",
    provider: "Ubuntu Server 22",
    description: "Small profile for faculty websites, student services and lightweight academic portals.",
    cpu: "1 vCPU",
    ram: "2 GB RAM",
    storage: "30 GB SSD",
    price: "$10/mo",
    badge: "Popular",
  },
  {
    id: 2,
    name: "E-learning Platform",
    provider: "Debian 11",
    description: "Balanced VM for Moodle-style platforms, online courses and academic collaboration tools.",
    cpu: "2 vCPU",
    ram: "4 GB RAM",
    storage: "60 GB Business_SSD",
    price: "$20/mo",
    badge: "Recommended",
  },
  {
    id: 3,
    name: "Research Lab Workspace",
    provider: "Ubuntu Server 24",
    description: "Compute-ready workspace for student projects, data processing and PFE prototypes.",
    cpu: "4 vCPU",
    ram: "8 GB RAM",
    storage: "100 GB Business_SSD",
    price: "$40/mo",
    badge: "Lab Ready",
  },
  {
    id: 4,
    name: "Administration Workspace",
    provider: "Windows Server 2022",
    description: "Windows-based environment for administrative tools, internal services and training sessions.",
    cpu: "2 vCPU",
    ram: "8 GB RAM",
    storage: "100 GB Business_SSD",
    price: "$30/mo",
    badge: "Admin",
  },
]

export default function MarketplacePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">
      {/* Topbar */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
            VM Marketplace
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Browse ready-to-deploy VM profiles for academic and research workloads
          </p>
        </div>

        <button
          onClick={() => router.push("/build-vm/instance")}
          className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
        >
          + Build Custom VM
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">Filters</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search VM templates..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
<div>
  <label className="mb-3 block text-sm font-medium text-slate-700">
    Price Range
  </label>

  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <input
      type="range"
      min="0"
      max="100"
      defaultValue="50"
      className="w-full accent-black"
    />

    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
      <span>$0</span>
      <span>$100+</span>
    </div>

    <div className="mt-3 text-sm font-medium text-slate-800">
      Up to $50/month
    </div>
  </div>
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Operating System
  </label>
  <div className="relative">
    <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100">
      <option>All OS</option>
      <option>Ubuntu</option>
      <option>Debian</option>
      <option>AlmaLinux</option>
      <option>Rocky Linux</option>
      <option>Windows Server</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
</div>




<div>
  <label className="mb-3 block text-sm font-medium text-slate-700">
    Specifications
  </label>

  <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4">

    {/* CPU */}
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        CPU
      </p>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          1 vCPU
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          2 vCPU
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          4 vCPU
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          8 vCPU
        </label>
      </div>
    </div>

    {/* RAM */}
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Memory
      </p>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          2 GB RAM
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          4 GB RAM
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          8 GB RAM
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          16 GB RAM
        </label>
      </div>
    </div>

    {/* Storage */}
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Storage
      </p>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          30 GB SSD
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          60 GB Business_SSD
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          100 GB Business_SSD
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          150 GB Business_SSD
        </label>
      </div>
    </div>

  </div>
</div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Features
              </label>
              <div className="space-y-3 text-sm text-slate-600">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  SSD Storage
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  High Availability
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Backup Included
                </label>
              </div>
            </div>

            <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Content */}
        <section>
          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">4</span> VM templates
            </p>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <SlidersHorizontal className="h-4 w-4" />
                Sort By
              </button>

              <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                Most Popular
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-5 xl:grid-cols-2">
            {vmTemplates.map((vm) => (
              <div
                key={vm.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{vm.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{vm.provider}</p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {vm.badge}
                  </span>
                </div>

                <p className="mb-5 text-sm leading-6 text-slate-600">
                  {vm.description}
                </p>

                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">CPU</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{vm.cpu}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Memory</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{vm.ram}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Storage</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{vm.storage}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Starting at</p>
                    <p className="text-2xl font-semibold text-slate-900">{vm.price}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      View Details
                    </button>

                    <button
                      onClick={() => router.push("/build-vm/instance")}
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
                    >
                      Deploy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
