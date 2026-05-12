"use client"

import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">

        <div className="font-bold text-lg">
          VM Marketplace
        </div>

        <div className="flex gap-6 text-sm">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/register">Register</Link>
        </div>

      </div>
    </nav>
  )
}