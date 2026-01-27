'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { fetchClient } from '@/lib/fetchClient'
import { apiRequest } from '@/lib/apiRequest'

/* ================= SCHEMA ================= */

const AccompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
})

const FormSchema = z.object({
  accompanies: z.array(AccompanySchema),
})

type FormValues = z.infer<typeof FormSchema>

/* ================= PAGE ================= */

export default function InvitationPage() {
  const params = useParams()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [guestName, setGuestName] = useState('')
  const [regNum, setRegNum] = useState('')
  const [quota, setQuota] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { accompanies: [] },
    mode: 'onTouched',
  })

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'accompanies',
  })

  /* ================= FETCH INVITATION ================= */

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const res = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/invitation/accompany-registration/${token}`,
          { method: 'GET' }
        )

        const data = await res.json()

        setGuestName(data.guestName)
        setRegNum(data.regNum)
        setQuota(data.accompanyQuota)

        replace(
          Array.from({ length: data.accompanyQuota }).map(() => ({
            name: '',
            email: '',
            mobile: '',
          }))
        )
      } catch {
        setInvalid(true)
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

      await apiRequest({
        endpoint: `/api/invitation/accompany-registration/${token}`,
        method: 'POST',
        body: values,
      })

      setSubmitted(true)

      toast.success(`Thank you ${guestName}`, {
        description:
          'Your accompanying guests have been registered successfully.',
        duration: 6000,
      })
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#F0FAFF] to-white">
      {/* ================= HEADER IMAGE ================= */}
      <div className="relative w-full h-[180px] sm:h-[220px] md:h-[280px] lg:h-[300px] overflow-hidden">
        <Image
          src="https://res.cloudinary.com/dymanaa1j/image/upload/v1769528693/12_codogj.png"
          alt="Marriage Ceremony Banner"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/60" />
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-4xl mx-auto px-4 mt-2 pb-20">
        <Card className="shadow-xl border-none">

          {/* ================= INVALID LINK (ONLY SCREEN) ================= */}
          {!loading && invalid && (
            <CardContent className="py-24 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent" />

                <h2 className="text-3xl font-serif font-semibold text-red-600">
                  Invitation Link Expired
                </h2>

                <p className="max-w-md text-base text-muted-foreground leading-relaxed">
                  This invitation link has already been used or is no longer
                  valid. For assistance, please contact the event organizers.
                </p>

                <p className="text-sm italic text-muted-foreground">
                  With warm regards,
                  <br />
                  <span className="font-medium text-[#3AC1F6]">
                    The Tendulkar Family
                  </span>
                </p>

                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-red-300 to-transparent" />
              </div>
            </CardContent>
          )}

          {/* ================= NORMAL FLOW ================= */}
          {!invalid && (
            <>
              {/* ================= HEADER ================= */}
              <CardHeader className="text-center">
                {loading && (
                  <>
                    <Skeleton className="h-6 w-56 mx-auto" />
                    <Skeleton className="h-4 w-40 mx-auto mt-2" />
                  </>
                )}

                {!loading && !submitted && (
                  <>
                    <CardTitle className="text-2xl sm:text-3xl text-[#3AC1F6] font-semibold">
                      Welcome, {guestName}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground mt-1">
                      Registration No:&nbsp;
                      <span className="font-medium text-foreground">
                        {regNum}
                      </span>
                    </p>

                    <div className="mt-4 max-w-xl mx-auto">
                      <p className="text-base text-[#2C3E50] leading-relaxed">
                        We are delighted to extend this invitation to you and
                        your family for the upcoming marriage ceremony.
                      </p>

                      <p className="text-base text-[#2C3E50] leading-relaxed mt-2">
                        As a valued guest, you may kindly register the details
                        of your accompanying family members below to help us
                        ensure a smooth and personalized experience.
                      </p>

                      <p className="text-sm text-muted-foreground mt-3 italic">
                        Your presence will truly add grace to the occasion.
                      </p>
                    </div>
                  </>
                )}

                {!loading && submitted && (
                  <>
                    <CardTitle className="text-3xl text-green-600 font-semibold">
                      Thank You, {guestName}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground mt-1">
                      Registration No.&nbsp;
                      <span className="font-medium text-foreground">
                        {regNum}
                      </span>
                    </p>
                  </>
                )}
              </CardHeader>

              {/* ================= BODY ================= */}
              <CardContent>
                {/* ================= SUCCESS BODY ================= */}
                {submitted && (
                  <div className="text-center py-12 max-w-2xl mx-auto">
                    <p className="text-lg text-[#2C3E50] leading-relaxed">
                      We are truly honored to have your presence at this
                      auspicious celebration.
                    </p>

                    <p className="text-lg text-[#2C3E50] leading-relaxed mt-4">
                      Your accompanying guest details have been successfully
                      registered. We look forward to welcoming you and your
                      family as we celebrate this special occasion together.
                    </p>

                    <p className="mt-8 text-base font-medium text-[#3AC1F6]">
                      With warm regards,
                    </p>

                    <p className="text-base font-semibold text-[#3AC1F6]">
                      The Tendulkar Family
                    </p>
                  </div>
                )}

                {/* ================= FORM ================= */}
                {!submitted && (
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

                        <div className="grid gap-3">
                          <Input
                            placeholder="Full Name"
                            {...form.register(`accompanies.${index}.name`)}
                          />
                          {form.formState.errors.accompanies?.[index]?.name && (
                            <p className="text-sm text-red-500">
                              {
                                form.formState.errors.accompanies[index]?.name
                                  ?.message
                              }
                            </p>
                          )}

                          <Input
                            type="email"
                            placeholder="Email"
                            {...form.register(`accompanies.${index}.email`)}
                          />
                          {form.formState.errors.accompanies?.[index]?.email && (
                            <p className="text-sm text-red-500">
                              {
                                form.formState.errors.accompanies[index]?.email
                                  ?.message
                              }
                            </p>
                          )}

                          <Input
                            placeholder="Mobile Number"
                            {...form.register(`accompanies.${index}.mobile`)}
                          />
                          {form.formState.errors.accompanies?.[index]?.mobile && (
                            <p className="text-sm text-red-500">
                              {
                                form.formState.errors.accompanies[index]?.mobile
                                  ?.message
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white"
                    >
                      {submitting
                        ? 'Submitting...'
                        : 'Submit Accompany Details'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
