import Image from "next/image"
import Link from "next/link"

export default function AppLogo() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/logo.svg"
        alt="VM Marketplace"
        width={180}
  height={60}
  className="h-14 w-auto object-contain"
        priority
      />
    </Link>
  )
}