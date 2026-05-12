import "./globals.css"
import { BuildVMProvider } from "./build-vm/BuildVMContext"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BuildVMProvider>{children}</BuildVMProvider>
      </body>
    </html>
  )
}
