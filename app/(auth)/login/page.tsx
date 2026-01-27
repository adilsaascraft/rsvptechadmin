'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { apiRequest } from '@/lib/apiRequest'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema, LoginFormData } from '@/validations/loginSchema'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginResponse {
  message: string
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, hydrate } = useAuthStore()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 🔐 Check session when visiting login page
  useEffect(() => {
    hydrate()
  }, [])

  // 🚀 If already logged in → webinar
  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // 🔑 Login submit (SAFE, SINGLE-SHOT)
  const onSubmit = async (data: LoginFormData) => {
    if (submitting || redirecting) return // 🔒 HARD GUARD

    setError('')
    setSubmitting(true)

    try {
      await apiRequest<LoginFormData, LoginResponse>({
        endpoint: '/api/admin/login',
        method: 'POST',
        body: data,
      })

      // 🔐 Fetch session
      await hydrate()

      // 🚦 Lock UI until navigation completes
      setRedirecting(true)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setSubmitting(false) // ❗ only re-enable on ERROR
    }
  }

  // ⛔ Prevent flicker
  if (isLoading) return null

  return (
    <div className="relative flex min-h-svh flex-col bg-linear-to-r from-[#A0E5FF] to-white">

{/* Ceremony Header */}
<div
  className="
    relative w-full
    h-[180px] sm:h-[220px] md:h-[280px] lg:h-[340px] xl:h-[380px]
    bg-center bg-no-repeat
    bg-contain md:bg-cover
  "
  style={{
    backgroundImage:
      "url('https://res.cloudinary.com/dymanaa1j/image/upload/v1769498303/sc_ozbk0g.png')",
  }}
>
  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/50" />
</div>




      

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <div className={cn('flex flex-col gap-6')}>
            <Card className="overflow-hidden p-0 bg-[#FBFBFB]">
               <CardContent
          className="
            grid p-0 md:grid-cols-2
            min-h-[450px] md:min-h-[450px]
          "
        >
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-[#3AC1F6]">
                        Admin Login
                      </h1>
                      <p className="text-muted-foreground">
                        Welcome back! Login to continue.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Label className="text-black">Email</Label>
                      <Input
                        type="email"
                        className="!bg-gray-100 text-black"
                        placeholder="Enter your email"
                        {...register('email')}
                        disabled={submitting || redirecting}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 relative">
                      <div className="flex items-center">
                        <Label className="text-black">Password</Label>
                        <a
                          href="/forgot-password"
                          className="ml-auto text-sm underline hover:underline text-black"
                        >
                          Forgot your password?
                        </a>
                      </div>

                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="!bg-gray-100 pr-10 text-black"
                        placeholder="Enter your password"
                        {...register('password')}
                        disabled={submitting || redirecting}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={submitting || redirecting}
                        className="absolute right-3 top-[38px] text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>

                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                      type="submit"
                      disabled={submitting || redirecting}
                      className="w-full bg-[#3AC1F6] hover:bg-[#1FAEE8] flex items-center justify-center gap-2"
                    >
                      {(submitting || redirecting) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {redirecting
                        ? 'Redirecting...'
                        : submitting
                        ? 'Authenticating...'
                        : 'Login'}
                    </Button>

          
                  </div>
                </form>

                <div className="relative hidden md:block">
                  <Image
                    src="https://res.cloudinary.com/dymanaa1j/image/upload/v1769496327/ChatGPT_Image_Jan_27_2026_12_14_08_PM_bhqp6i.png"
                    alt="login image"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Card className="rounded-none border-t bg-white/20 backdrop-blur-xl">
        <CardContent className="py-4 text-center text-xs text-gray-600">
          © All Rights Reserved.
          Powered by SaaScraft Studio (India) Pvt. Ltd.
        </CardContent>
      </Card>
    </div>
  )
}
