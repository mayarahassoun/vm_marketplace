"use client"

import Link from "next/link"
import {
  Zap,
  Shield,
  Boxes,
  Headphones,
  Star,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react"
import AppLogo from "@/components/AppLogo"

const featuredVMs = [
  {
    id: 1,
    name: "University Web Portal",
    price: "$10/month",
    rating: "4.8",
    cpu: "1 vCPU",
    ram: "2 GB",
    storage: "30 GB SSD",
    os: "Ubuntu Server 22",
    description:
      "Small VM profile for faculty websites, student services and lightweight administrative portals.",
  },
  {
    id: 2,
    name: "E-learning Platform",
    price: "$20/month",
    rating: "4.6",
    cpu: "2 vCPU",
    ram: "4 GB",
    storage: "60 GB Business_SSD",
    os: "Debian 11",
    description:
      "Balanced configuration for Moodle-style platforms, online courses and academic collaboration tools.",
  },
  {
    id: 3,
    name: "Research Lab Workspace",
    price: "$40/month",
    rating: "4.9",
    cpu: "4 vCPU",
    ram: "8 GB",
    storage: "100 GB Business_SSD",
    os: "Ubuntu 24.04",
    description:
      "Compute-ready VM for student projects, data processing, development environments and PFE prototypes.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <AppLogo />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="/marketplace" className="hover:text-slate-900">
              Marketplace
            </Link>
            <button className="hover:text-slate-900">Pricing</button>
            <button className="hover:text-slate-900">Documentation</button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>

            <Link
              href="/auth/register"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-10">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-20 text-white shadow-xl md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              VM Marketplace
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
              Deploy virtual machines in seconds. Choose from thousands of
              pre-configured images and build the infrastructure that fits your needs.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/marketplace"
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                Browse Marketplace
              </Link>

              <Link
                href="/build-vm/instance"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15"
              >
                Build Custom VM
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            Why Choose Our VM Marketplace
          </h2>
          <p className="mt-3 text-slate-500">
            Our platform offers a seamless experience for both VM providers and customers.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Zap className="h-5 w-5 text-blue-500" />
            <h3 className="mt-4 text-lg font-semibold">Instant Deployment</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Deploy your virtual machine in seconds with our automated provisioning system.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Boxes className="h-5 w-5 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold">Wide Selection</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose from thousands of pre-configured VMs for every use case and budget.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Shield className="h-5 w-5 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold">Secure & Reliable</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              All VMs are scanned for vulnerabilities and backed by uptime guarantees.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <Headphones className="h-5 w-5 text-violet-500" />
            <h3 className="mt-4 text-lg font-semibold">Multi-Cloud Support</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Deploy to AWS, Azure, GCP, or your own infrastructure with a single click.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED VMS */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            Featured Virtual Machines
          </h2>
          <p className="mt-3 text-slate-500">
            Explore VM profiles designed for Tunisian academic and research use cases.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredVMs.map((vm) => (
            <div
              key={vm.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-300">
                <div className="text-sm">VM Preview</div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{vm.name}</h3>

                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {vm.rating}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {vm.description}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-slate-400" />
                    {vm.cpu}
                  </div>

                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-slate-400" />
                    {vm.ram}
                  </div>

                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-slate-400" />
                    {vm.storage}
                  </div>

                  <div className="text-slate-500">{vm.os}</div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-semibold">{vm.price}</span>

                  <Link
                    href="/marketplace"
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/marketplace"
            className="inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-slate-900"
          >
            View All VMs
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-16 text-center text-white">
          <h2 className="text-4xl font-semibold tracking-tight">
            Ready to Get Started?
          </h2>

          <p className="mt-3 text-slate-300">
            Join thousands of users who trust our marketplace for their VM needs.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Sign Up Now
            </Link>

            <Link
              href="/marketplace"
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
