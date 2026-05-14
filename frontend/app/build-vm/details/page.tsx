"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"
import { useBuildVM } from "../BuildVMContext"
import AppLogo from "@/components/AppLogo"
import BuildVMSteps from "../BuildVMSteps"

const vmNameRegex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/

export default function BuildVMDetailsPage() {
  const router = useRouter()
  const { data, setData } = useBuildVM()

  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const total =
    data.instancePrice +
    data.storagePrice +
    data.networkPrice +
    data.regionPrice

  const isVmNameValid = vmNameRegex.test(data.vmName || "")
  const isPasswordValid = passwordRegex.test(data.password || "")
  const isPasswordConfirmed = data.password === confirmPassword

  const canReview = isVmNameValid && isPasswordValid && isPasswordConfirmed

  function generatePassword() {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lower = "abcdefghijkmnopqrstuvwxyz"
    const numbers = "23456789"
    const symbols = "!@#$%^&*"
    const all = upper + lower + numbers + symbols

    let result =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = 4; i < 16; i++) {
      result += all[Math.floor(Math.random() * all.length)]
    }

    result = result
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")

    setData((prev) => ({
      ...prev,
      password: result,
    }))

    setConfirmPassword(result)
  }

  function handleGoToReview() {
    if (!canReview) return
    router.push("/build-vm/review")
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <AppLogo />

          <div className="hidden items-center gap-10 text-sm font-medium text-slate-700 md:flex">
            <Link href="/marketplace" className="hover:text-slate-900">
              Marketplace
            </Link>
            <button className="hover:text-slate-900">Pricing</button>
            <button className="hover:text-slate-900">Documentation</button>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/build-vm/region"
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Build Your Custom VM
          </Link>

          <p className="max-w-4xl text-lg leading-8 text-slate-500">
            Define the final identity and access credentials of your virtual
            machine before reviewing the complete configuration.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <BuildVMSteps active="Details" />

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />

                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      VM Details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose a clear and unique name for your virtual machine.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="vm-name"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      VM Name
                    </label>

                    <input
                      id="vm-name"
                      type="text"
                      name="vm-name"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="text"
                      value={data.vmName}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          vmName: e.target.value.toLowerCase(),
                        }))
                      }
                      placeholder="example: ubuntu-dev-01"
                      className={[
                        "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-4",
                        data.vmName && !isVmNameValid
                          ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-100",
                      ].join(" ")}
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Use 3–30 characters. Lowercase letters, numbers and hyphens
                      only. Example: ubuntu-dev-01
                    </p>

                    {data.vmName && !isVmNameValid && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        VM name must be 3–30 characters and can contain only
                        lowercase letters, numbers and hyphens. It cannot start
                        or end with a hyphen.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="vm-description"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      Description Optional
                    </label>

                    <textarea
                      id="vm-description"
                      name="vm-description"
                      autoComplete="off"
                      value={data.description}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Example: Development server for backend testing"
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-blue-500" />

                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      VM Password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a secure administrator password for accessing your VM.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />

                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Security recommendation
                      </p>
                      <p className="mt-1 text-sm leading-6 text-blue-700">
                        Use a strong password with at least 12 characters,
                        including uppercase, lowercase, number and special
                        character. You can also generate a secure password
                        automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="vm-admin-password"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      Admin Password
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          id="vm-admin-password"
                          type={showPassword ? "text" : "password"}
                          name="vm-admin-password"
                          autoComplete="new-password"
                          value={data.password}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Enter a strong password"
                          className={[
                            "w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-4",
                            data.password && !isPasswordValid
                              ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                              : "border-slate-200 focus:border-slate-400 focus:ring-slate-100",
                          ].join(" ")}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={generatePassword}
                        className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-slate-900"
                      >
                        Generate
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Minimum 12 characters with uppercase, lowercase, number and
                      special character.
                    </p>

                    {data.password && !isPasswordValid && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        Password is too weak. Please use at least 12 characters
                        with uppercase, lowercase, number and special character.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="vm-admin-password-confirm"
                      className="mb-2 block text-sm font-medium text-slate-800"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        id="vm-admin-password-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        name="vm-admin-password-confirm"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className={[
                          "w-full rounded-xl border bg-white px-4 py-3 pr-10 text-sm outline-none focus:ring-4",
                          confirmPassword && !isPasswordConfirmed
                            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                            : "border-slate-200 focus:border-slate-400 focus:ring-slate-100",
                        ].join(" ")}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {confirmPassword && !isPasswordConfirmed && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        Passwords do not match.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/build-vm/region")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleGoToReview}
                disabled={!canReview}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition",
                  canReview
                    ? "bg-black text-white hover:bg-slate-900"
                    : "cursor-not-allowed bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                Review Configuration
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-3xl font-semibold text-slate-900">
              Pricing Summary
            </h2>

            <div className="mt-8 space-y-4 text-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Instance ({data.instanceName})
                </span>
                <span className="font-semibold text-slate-900">
                  ${data.instancePrice}/mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Storage ({data.storageSize} GB {data.storageType})
                </span>
                <span className="font-semibold text-slate-900">
                  ${data.storagePrice}/mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Network ({data.bandwidthSize} Mbps Standard)
                </span>
                <span className="font-semibold text-slate-900">
                  ${data.networkPrice}/mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Region ({data.region})</span>
                <span className="font-semibold text-slate-900">
                  ${data.regionPrice}/mo
                </span>
              </div>
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                Total
              </span>
              <span className="text-3xl font-semibold text-slate-900">
                ${total}/mo
              </span>
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-500">
              Prices are shown in USD and billed monthly. Additional taxes may
              apply depending on your location.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
