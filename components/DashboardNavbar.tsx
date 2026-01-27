'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'

/* ================= COMPONENT ================= */

export default function DashboardNavbar() {
  const router = useRouter()
  const clearUser = useAuthStore((s) => s.clearUser)

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  /* ================= SESSION EXPIRED ================= */

  useEffect(() => {
    const handler = () => setSessionExpired(true)
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

  /* ================= LOGOUT HANDLER ================= */

  const performLogout = async () => {
    if (loggingOut) return

    try {
      setLoggingOut(true)

      await apiRequest({
        endpoint: '/api/admin/logout',
        method: 'POST',
        showToast: false,
      })

      clearUser()
      setLogoutOpen(false)
      setSessionExpired(false)

      router.replace('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  /* ================= UI ================= */

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#3AC1F6] to-[#A0E5FF] shadow-md">
        <div className="flex items-center justify-end h-16 px-4 md:px-8">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-2 bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white font-semibold px-6 py-2 rounded-full transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* ================= LOGOUT CONFIRM ================= */}

      <AlertDialog open={logoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <button
              onClick={() => setLogoutOpen(false)}
              disabled={loggingOut}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>

            <button
              onClick={performLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-white disabled:opacity-60"
            >
              {loggingOut && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Logout
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================= SESSION EXPIRED ================= */}

      <AlertDialog open={sessionExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Expired</AlertDialogTitle>
            <AlertDialogDescription>
              Your session has expired. Please login again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <button
              onClick={performLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-md bg-[#3AC1F6] hover:bg-[#1FAEE8] px-4 py-2 text-white disabled:opacity-60"
            >
              {loggingOut && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Login Again
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
