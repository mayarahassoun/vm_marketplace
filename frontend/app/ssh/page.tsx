"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { WS_URL } from "@/lib/api"

function SSHPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import("xterm").Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const host = searchParams.get("host")
  const password = searchParams.get("password")
  const vmName = searchParams.get("name")

  useEffect(() => {
    if (!terminalRef.current || !host || !password) return

    // Import dynamique pour éviter SSR issues
    const initTerminal = async () => {
      const { Terminal } = await import("xterm")
      const { FitAddon } = await import("xterm-addon-fit")
      await import("xterm/css/xterm.css")

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        theme: {
          background: "#0f172a",
          foreground: "#e2e8f0",
          cursor: "#38bdf8",
          selectionBackground: "#1e40af",
        },
        cols: 220,
        rows: 50,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(terminalRef.current!)
      fitAddon.fit()
      termRef.current = term

      term.writeln("\x1b[36m Connecting to " + host + "...\x1b[0m")

      const ws = new WebSocket(`${WS_URL}/api/ssh/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          host,
          password,
          username: "root",
        }))
        setConnected(true)
      }

      ws.onmessage = (event) => {
        term.write(event.data)
      }

      ws.onerror = () => {
        setError("WebSocket connection failed")
        term.writeln("\r\n\x1b[31m❌ Connection failed\x1b[0m")
      }

      ws.onclose = () => {
        setConnected(false)
        term.writeln("\r\n\x1b[33m🔌 Disconnected\x1b[0m")
      }

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      const handleResize = () => fitAddon.fit()
      window.addEventListener("resize", handleResize)

      return () => {
        ws.close()
        term.dispose()
        window.removeEventListener("resize", handleResize)
      }
    }

    initTerminal()
  }, [host, password])

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{vmName}</span>
            <span className="text-sm text-slate-400">—</span>
            <span className="text-sm text-slate-400">{host}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-slate-400">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="h-[calc(100vh-120px)] w-full overflow-hidden rounded-xl border border-slate-700"
      />
    </div>
  )
}

export default function SSHPage() {
  return (
    <Suspense fallback={null}>
      <SSHPageContent />
    </Suspense>
  )
}
