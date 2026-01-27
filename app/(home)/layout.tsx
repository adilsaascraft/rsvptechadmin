'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import DashboardNavbar from '@/components/DashboardNavbar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const { isAuthenticated, isLoading, hydrate } = useAuthStore()

  // =============================
  // 🔐 AUTH BOOTSTRAP
  // =============================
  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // ⛔ Prevent UI flicker while checking auth
  if (isLoading) return null

  return (
    <>
      {/* Top Navbar */}
      <DashboardNavbar />

      

      {/* Main layout */}
      <div className="flex flex-1">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  )
}
