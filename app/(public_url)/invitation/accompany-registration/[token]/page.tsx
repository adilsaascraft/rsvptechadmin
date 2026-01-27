'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

/* ================= SCHEMA ================= */

const AccompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  mobile: z
    .string()
    .regex(/^\d{10}$/, 'Mobile must be 10 digits'),
})

const FormSchema = z.object({
  accompanies: z.array(AccompanySchema),
})

type FormValues = z.infer<typeof FormSchema>

/* ================= PAGE ================= */

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [guestName, setGuestName] = useState('')
  const [regNum, setRegNum] = useState('')
  const [quota, setQuota] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { accompanies: [] },
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'accompanies',
  })

  /* ================= FETCH INVITATION ================= */

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/invitation/accompany-registration/${token}`
        )

        if (!res.ok) throw new Error('Invalid or expired invitation')

        const data = await res.json()

        setGuestName(data.guestName)
        setRegNum(data.regNum)
        setQuota(data.accompanyQuota)

        // create dynamic fields
        replace(
          Array.from({ length: data.accompanyQuota }).map(() => ({
            name: '',
            email: '',
            mobile: '',
          }))
        )
      } catch (err: any) {
        toast.error(err.message || 'Invitation link expired')
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token, replace])

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: FormValues) => {
    if (values.accompanies.length !== quota) {
      toast.error('Please fill all accompany details')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/invitation/accompany-registration/${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      )

      if (!res.ok) throw new Error('Submission failed')

      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#F0FAFF] to-white">
      {/* ================= HEADER ================= */}
      <div className="relative w-full h-[180px] sm:h-[220px] md:h-[280px] lg:h-[300px] overflow-hidden">
        <Image
          src="https://res.cloudinary.com/dymanaa1j/image/upload/v1769528693/12_codogj.png"
          alt="Marriage Ceremony Banner"
          fill
          priority
          className="object-fit"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/60" />
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-20">
        <Card className="shadow-xl border-none">
          <CardHeader className="text-center">
            {loading ? (
              <>
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto mt-2" />
              </>
            ) : (
              <>
                <CardTitle className="text-2xl text-[#3AC1F6]">
                  Welcome {guestName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Registration No: <b>{regNum}</b>
                </p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}

            {!loading && submitted && (
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold text-green-600">
                  Thank you!
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Your accompanying guests have been registered successfully.
                </p>
              </div>
            )}

            {!loading && !submitted && (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 bg-[#FAFDFF]"
                  >
                    <h3 className="font-semibold mb-4 text-[#3AC1F6]">
                      Accompany {index + 1}
                    </h3>

                    <div className="grid gap-4">
                      <Input
                        placeholder="Full Name"
                        {...form.register(`accompanies.${index}.name`)}
                      />

                      <Input
                        type="email"
                        placeholder="Email"
                        {...form.register(`accompanies.${index}.email`)}
                      />

                      <Input
                        placeholder="Mobile Number"
                        {...form.register(`accompanies.${index}.mobile`)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Accompany Details'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
