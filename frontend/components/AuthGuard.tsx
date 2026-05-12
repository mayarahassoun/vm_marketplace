"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized] = useState(
    () => typeof window !== "undefined" && Boolean(localStorage.getItem("token"))
  )

  useEffect(() => {
    if (!authorized) {
      router.push("/auth/login")
    }
  }, [authorized, router])

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-slate-400">Checking authentication...</div>
      </div>
    )
  }

  return <>{children}</>
}
