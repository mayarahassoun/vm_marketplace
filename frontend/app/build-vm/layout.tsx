import Navbar from "@/components/Navbar"

export default function BuildVMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar active="Build VM" backLabel="Dashboard" backHref="/dashboard" />
      {children}
    </>
  )
}
