"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, clearAuthToken, getCurrentUser } from "@/lib/api"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/auth/login")
      return
    }

    // Validate the token is still accepted by the backend
    getCurrentUser(token)
      .then(() => setAuthorized(true))
      .catch(() => {
        clearAuthToken()
        router.push("/auth/login")
      })
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
