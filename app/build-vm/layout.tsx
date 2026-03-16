import { BuildVMProvider } from "./BuildVMContext"

export default function BuildVMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BuildVMProvider>{children}</BuildVMProvider>
}