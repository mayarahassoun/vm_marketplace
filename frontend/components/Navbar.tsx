"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import AppLogo from "@/components/AppLogo"

type NavItem = { label: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",         href: "/dashboard" },
  { label: "Marketplace",       href: "/marketplace" },
  { label: "Build VM",          href: "/build-vm/instance" },
  { label: "Clusters",          href: "/build-cluster" },
  { label: "AI Recommendation", href: "/ai-recommendation" },
]

type Props = {
  active?: string     // matches NavItem.label to underline current page
  backLabel?: string  // shows "← BackLabel / Active" breadcrumb strip below bar
  backHref?: string   // omit to use router.back()
}

export default function Navbar({ active, backLabel, backHref }: Props) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <AppLogo />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === active
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "text-slate-900 underline underline-offset-4 decoration-2"
                      : "hover:text-slate-900 transition-colors"
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </header>

      {backLabel && (
        <div className="border-b border-slate-100 bg-white px-6 py-2">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-sm text-slate-500">
            <button
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </button>
            <span>/</span>
            <span className="font-medium text-slate-900">{active}</span>
          </div>
        </div>
      )}
    </div>
  )
}
