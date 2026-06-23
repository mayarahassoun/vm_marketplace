"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Terminal, X } from "lucide-react"
import { WS_URL } from "@/lib/api"

function PasswordModal({
  clusterName, masterIp, onConfirm, onClose,
}: {
  clusterName: string
  masterIp: string
  onConfirm: (password: string) => void
  onClose: () => void
}) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">SSH — Cluster Master</h2>
              <p className="text-sm text-slate-500">{clusterName} — {masterIp}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
          Ce cluster n&apos;a pas de clé SSH stockée. Utilise le mot de passe administrateur
          saisi lors de la création du cluster.
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-800">
            Mot de passe root
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && password) onConfirm(password) }}
              placeholder="Mot de passe administrateur du cluster"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              {show ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={() => password && onConfirm(password)}
            disabled={!password}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Terminal className="h-4 w-4" />
            Connecter
          </button>
        </div>
      </div>
    </div>
  )
}

function ClusterSSHContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const terminalRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const pendingPasswordRef = useRef<((pw: string) => void) | null>(null)

  const clusterId = searchParams.get("id")
  const clusterName = searchParams.get("name") ?? "Cluster"
  const masterIp = searchParams.get("ip") ?? ""
  const needsPassword = searchParams.get("needsPassword") === "true"

  useEffect(() => {
    if (!terminalRef.current || !clusterId) return

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

      term.writeln(`\x1b[36m Connecting to cluster master ${masterIp}...\x1b[0m`)

      // If password needed, show modal BEFORE opening WS
      let password: string | null = null
      if (needsPassword) {
        password = await new Promise<string>((resolve) => {
          pendingPasswordRef.current = resolve
          setShowModal(true)
        })
      }

      const ws = new WebSocket(`${WS_URL}/api/clusters/${clusterId}/ssh-ws`)
      wsRef.current = ws

      ws.onopen = () => {
        if (password) {
          // Send password as first message for clusters without stored key
          ws.send(JSON.stringify({ password }))
        }
        setConnected(true)
      }

      ws.onmessage = (event) => term.write(event.data)

      ws.onerror = () => {
        setError("WebSocket connection failed")
        term.writeln("\r\n\x1b[31m❌ Connection failed\x1b[0m")
      }

      ws.onclose = () => {
        setConnected(false)
        term.writeln("\r\n\x1b[33m🔌 Disconnected\x1b[0m")
      }

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data)
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
  }, [clusterId, masterIp, needsPassword])

  function handlePasswordConfirm(pw: string) {
    setShowModal(false)
    pendingPasswordRef.current?.(pw)
    pendingPasswordRef.current = null
  }

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-6">
      {showModal && (
        <PasswordModal
          clusterName={clusterName}
          masterIp={masterIp}
          onConfirm={handlePasswordConfirm}
          onClose={() => { setShowModal(false); router.push("/dashboard") }}
        />
      )}

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
            <span className="text-sm font-medium text-white">{clusterName}</span>
            <span className="text-sm text-slate-400">—</span>
            <span className="text-sm text-slate-400">Master: {masterIp}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-slate-400">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div
        ref={terminalRef}
        className="h-[calc(100vh-120px)] w-full overflow-hidden rounded-xl border border-slate-700"
      />
    </div>
  )
}

export default function ClusterSSHPage() {
  return (
    <Suspense fallback={null}>
      <ClusterSSHContent />
    </Suspense>
  )
}
