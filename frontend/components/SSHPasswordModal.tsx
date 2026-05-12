"use client"

import { useState } from "react"
import { Terminal, X } from "lucide-react"

type Props = {
  vmName: string
  vmIp: string
  onConfirm: (password: string) => void
  onClose: () => void
}

export default function SSHPasswordModal({ vmName, vmIp, onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">SSH Console</h2>
              <p className="text-sm text-slate-500">{vmName} — {vmIp}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Info */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <p>Connecting as <strong>root</strong> to <strong>{vmIp}</strong></p>
        </div>

        {/* Password input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-800">
            VM Password
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) onConfirm(password)
              }}
              placeholder="Enter your VM password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => password && onConfirm(password)}
            disabled={!password}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Terminal className="h-4 w-4" />
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}