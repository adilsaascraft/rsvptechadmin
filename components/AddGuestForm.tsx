'use client'

import { useEffect, useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'
import {
  zodResolver,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button, SheetClose, toast,
} from '@/lib/imports'
import { fetchClient } from '@/lib/fetchClient'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { GuestFormSchema, GuestFormValues } from '@/validations/guestSchema'

/* ================= PROPS ================= */

type AddGuestFormProps = {
  defaultValues?: GuestFormValues & { _id?: string }
  onSave: (data: any) => Promise<void>
}

/* ================= COMPONENT ================= */

export default function AddGuestForm({
  defaultValues,
  onSave,
}: AddGuestFormProps) {
  const [loading, setLoading] = useState(false)

  const DRAFT_KEY = 'add-guest-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const draft = drafts[DRAFT_KEY]

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(GuestFormSchema),
    defaultValues:
      draft || {
        name: defaultValues?.name || '',
        email: defaultValues?.email || '',
        mobile: defaultValues?.mobile || '',
        accompanyQuota: defaultValues?.accompanyQuota ?? 0,
        description: defaultValues?.description || '',
      },
  })

  /* ================= DRAFT PERSIST ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = form.watch((values) => setDraft(DRAFT_KEY, values))
    return () => sub.unsubscribe()
  }, [form.watch, defaultValues?._id])

  /* ================= SUBMIT ================= */

  const onSubmit = async (data: GuestFormValues) => {
    try {
      setLoading(true)

      const url = defaultValues?._id
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/guests/${defaultValues._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/guests`

      const method = defaultValues?._id ? 'PUT' : 'POST'

      const res = await fetchClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to save')

      toast.success(
        defaultValues ? 'Guest updated successfully!' : 'Guest created successfully!',
        { description: getIndianFormattedDate() }
      )

      await onSave(json.data)
      form.reset()
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto mb-20 px-3">
        <Form {...form}>
          <form
            id="add-guest-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pb-20"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile */}
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Accompany Quota */}
            <FormField
              control={form.control}
              name="accompanyQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accompany Quota *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (Rich Text Editor) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Write something..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="add-guest-form"
          disabled={loading}
          className="bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white"
        >
          {loading
            ? defaultValues
              ? 'Updating...'
              : 'Creating...'
            : defaultValues
            ? 'Update'
            : 'Create'}
        </Button>
      </div>
    </div>
  )
}
