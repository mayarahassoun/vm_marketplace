"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken } from "@/lib/api"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hasToken = Boolean(getAuthToken())
      setAuthorized(hasToken)

      if (!hasToken) {
        router.push("/auth/login")
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  if (authorized !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-slate-400">Checking authentication...</div>
      </div>
    )
  }

  return <>{children}</>
}
