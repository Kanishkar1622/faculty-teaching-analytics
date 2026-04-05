"use client"

import dynamic from "next/dynamic"

const ClientApp = dynamic(() => import("@/components/client-app"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
})

export default function Home() {
  return <ClientApp />
}
