"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  ChevronDown,
  Calendar,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useBuildVM } from "../BuildVMContext"

export default function BuildVMPaymentPage() {
  const router = useRouter()
  const { data } = useBuildVM()

  const [region, setRegion] = useState(data.region)
  const [quantity, setQuantity] = useState(1)

  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [securityCode, setSecurityCode] = useState("")
  const [country, setCountry] = useState("Tunisie")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")

  const additionalDisksTotal = useMemo(
    () => data.additionalDisks.reduce((sum, disk) => sum + disk.price, 0),
    [data.additionalDisks]
  )

  const unitPrice =
    data.instancePrice +
    data.storagePrice +
    additionalDisksTotal +
    data.networkPrice +
    data.regionPrice

  const totalPrice = unitPrice * quantity

  function handlePayNow() {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Image
  src="/logo.svg"
  alt="VM Market"
  width={120}
  height={40}
  className="object-contain"
/>

          <div className="hidden items-center gap-10 text-sm font-medium text-slate-700 md:flex">
            <Link href="/marketplace">Marketplace</Link>
            <button>Pricing</button>
            <button>Documentation</button>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* LEFT SIDE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <Link
              href="/build-vm/review"
              className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <h1 className="text-3xl font-semibold text-slate-900">{data.vmName}</h1>

            <div className="mt-6 border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-4 w-4" />
                  {data.instanceCpu}
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-4 w-4" />
                  {data.instanceRam}
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-4 w-4" />
                  {data.storageSize} GB {data.storageType}
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-4 w-4" />
                  {data.os}
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="text-blue-500 h-4 w-4" />
                  {region}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">

            {/* CONFIGURATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Configuration</h2>

              <div className="mt-4 space-y-4">

                <div>
                  <label className="text-sm font-medium">Region</label>
                  <div className="relative mt-1">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 pr-10"
                    >
                      <option value="tn-global-1">tn-global-1</option>
                      <option value="tn-global-2">tn-global-2</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full border rounded-xl px-4 py-3"
                  />
                </div>

                <div className="border-t pt-4 flex justify-between">
                  <span>Total Price</span>
                  <span className="font-semibold text-lg">
                    ${totalPrice}/month
                  </span>
                </div>

              </div>
            </div>

            {/* PAYMENT FORM */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Payment Method</h2>

              <div className="mt-5 space-y-4">

                {/* CARD NUMBER */}
                <div>
                  <label className="text-sm font-medium">Numéro de carte</label>

                  <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 1234 1234 1234"
                      className="w-full border rounded-xl pl-10 pr-28 py-3"
                    />

                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                      <img
                        src="/payment/mastercard.svg"
                        alt="mastercard"
                        className="h-6 w-auto"
                      />
                      <img
                        src="/payment/visa.svg"
                        alt="visa"
                        className="h-6 w-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* EXPIRY */}
                <div>
                  <label className="text-sm font-medium">Date expiration</label>

                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM / AA"
                      className="w-full border rounded-xl pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                {/* CVC */}
                <div>
                  <label className="text-sm font-medium">Code de sécurité</label>

                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="CVC"
                      className="w-full border rounded-xl pl-10 pr-16 py-3"
                    />

                    <div className="absolute right-3 top-1/2 flex h-6 w-10 -translate-y-1/2 items-center justify-center rounded border border-slate-200 bg-white text-xs text-slate-500">
                      123
                    </div>
                  </div>
                </div>

                {/* COUNTRY */}
                <div>
                  <label className="text-sm font-medium">Pays</label>

                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border rounded-xl pl-10 pr-4 py-3"
                    >
                      <option>Tunisie</option>
                      <option>France</option>
                      <option>Canada</option>
                      <option>Fidji</option>
                    </select>
                  </div>
                </div>

                {/* SECURITY */}
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Paiement sécurisé
                </div>

                {/* BUTTONS */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => router.push("/build-vm/review")}
                    className="border px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handlePayNow}
                    className="bg-black text-white px-6 py-2 rounded-xl"
                  >
                    Pay Now
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}