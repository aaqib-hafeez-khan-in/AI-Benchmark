import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Model Benchmark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#09090b]">{children}</body>
    </html>
  )
}
