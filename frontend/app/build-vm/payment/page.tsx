"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useBuildVM } from "../BuildVMContext"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { API_URL } from "@/lib/api"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

const CARD_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#0f172a",
      "::placeholder": { color: "#94a3b8" },
    },
  },
}

function PaymentForm() {
  const router = useRouter()
  const { data } = useBuildVM()
  const stripe = useStripe()
  const elements = useElements()

  const [region, setRegion] = useState(data.region)
  const [quantity, setQuantity] = useState(1)
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("Tunisie")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handlePayNow() {
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("authToken")

      if (!token) {
        throw new Error("Vous devez vous connecter avant de créer une VM.")
      }

      const cardElement = elements.getElement(CardNumberElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: { email },
        })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (!paymentMethod) {
        throw new Error("Payment method not created")
      }

      const res = await fetch(`${API_URL}/payment/pay-and-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          email,
          amount: Math.round(totalPrice * 100),
          vm_data: {
            instance_name: data.vmName,
            availability_zone: "tn-global-1a",
            instance_flavor_id: data.instanceId,
            instance_image_id: data.os,
            security_group_id: "3953708c-a708-435d-ab3c-6ef2c0ae0388",
            subnet_id: data.subnetId,
            administrator_password: data.password,
            system_disk_type: data.storageType,
            system_disk_size: data.storageSize,
          },
        }),
      })
      if (res.status === 401) {
  localStorage.removeItem("token")
  localStorage.removeItem("access_token")
  localStorage.removeItem("authToken")
  setError("Your session has expired. Please login again.")

  setTimeout(() => {
    router.push("/login")
  }, 1200)

  return
}


      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Payment failed")
      }

      const result = await res.json()
      router.push(`/build-vm/loading?session_id=${result.session_id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Link
            href="/build-vm/review"
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <h1 className="text-3xl font-semibold text-slate-900">
            {data.vmName}
          </h1>

          <div className="mt-6 border-b pb-6">
            <h2 className="mb-4 text-xl font-semibold">Features</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {data.instanceCpu}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {data.instanceRam}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {data.storageSize} GB {data.storageType}
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {data.osName}
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                {region}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Configuration</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Region</label>

                <div className="relative mt-1">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 pr-10"
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
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="flex justify-between border-t pt-4">
                <span>Total Price</span>
                <span className="text-lg font-semibold">
                  ${totalPrice}/month
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold">Payment Method</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Card Number
                </label>

                <div className="rounded-xl border px-4 py-3">
                  <CardNumberElement options={CARD_STYLE} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Expiry
                  </label>

                  <div className="rounded-xl border px-4 py-3">
                    <CardExpiryElement options={CARD_STYLE} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">CVC</label>

                  <div className="rounded-xl border px-4 py-3">
                    <CardCvcElement options={CARD_STYLE} />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Country
                </label>

                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border pl-10 pr-4 py-3"
                  >
                    <option>Tunisie</option>
                    <option>France</option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-green-600">
                <ShieldCheck className="h-4 w-4" />
                Secured by Stripe
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => router.push("/build-vm/review")}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePayNow}
                  disabled={loading || !stripe}
                  className="rounded-xl bg-black px-6 py-2 text-sm text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Processing... ⏳" : `Pay $${totalPrice}/mo`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuildVMPaymentPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
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

      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  )
}
