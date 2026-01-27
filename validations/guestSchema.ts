import { z } from 'zod'

export const GuestFormSchema = z.object({
  _id: z.string().optional(),

  name: z
    .string()
    .min(1, 'Name is required.')
    .max(150, 'Name cannot exceed 150 characters.'),

  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),

  mobile: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits.')
    .max(15, 'Mobile number cannot exceed 15 digits.')
    .regex(/^[0-9]+$/, 'Mobile number must contain only digits.'),

  accompanyQuota: z
    .number()
    .min(0, 'Accompany quota cannot be negative.')
    .max(100, 'Accompany quota cannot exceed 100.'),

  description: z
    .string()
    .max(10000, 'Description cannot exceed 10000 characters.')
    .optional()
    .or(z.literal('')),
})

export type GuestFormValues = z.infer<typeof GuestFormSchema>
