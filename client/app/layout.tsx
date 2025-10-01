import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import { SWRConfig } from "swr"
import { swrFetcher } from "@/lib/api"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false }}>
            <AuthProvider>
              <Navbar />
              <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
            </AuthProvider>
          </SWRConfig>
        </Suspense>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
