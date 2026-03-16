import {
  LayoutDashboard,
  Store,
  CreditCard,
  Settings,
} from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#fafafa]">

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white px-6 py-8">

        {/* Logo */}
        <h2 className="mb-8 text-2xl font-semibold text-slate-900">
          VM Marketplace
        </h2>

        {/* Navigation */}
        <nav className="space-y-2">

          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/marketplace"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Store className="h-4 w-4" />
            Marketplace
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>

          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  )
}