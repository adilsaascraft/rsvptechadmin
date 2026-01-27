'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from "@/components/ui/checkbox"
import AddGuestForm from '@/components/AddGuestForm'
import { DataTable } from '@/components/DataTable'
import { GuestFormValues } from '@/validations/guestSchema'
import EntitySkeleton from '@/components/EntitySkeleton'

import { fetcher } from '@/lib/fetcher'
import { apiRequest } from '@/lib/apiRequest'

/* ================= HTML HELPERS ================= */

const stripHtml = (html?: string) => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/* ================= TYPES ================= */

type GuestRow = GuestFormValues & { _id: string }

/* ================= COMPONENT ================= */

export default function GuestClient() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null)
  const [viewDescription, setViewDescription] = useState<string | null>(null)

  /* ================= FETCH ================= */

  const { data, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/guests`,
    fetcher
  )

  const guests: GuestRow[] = useMemo(() => data ?? [], [data])

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingGuest(null)
    setSheetOpen(true)
  }

  const handleEdit = (guest: GuestRow) => {
    setEditingGuest(guest)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    await mutate()
    setSheetOpen(false)
    setEditingGuest(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiRequest({
        endpoint: `/api/admin/guests/${id}`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Guest deleted successfully',
      })
      await mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<GuestRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'regNum',
      header: sortableHeader('Reg. No.'),
    },
    {
      accessorKey: 'name',
      header: sortableHeader('Full Name'),
    },
    {
      accessorKey: 'email',
      header: sortableHeader('Email'),
    },
    {
      accessorKey: 'mobile',
      header: sortableHeader('Mobile'),
    },
    {
      accessorKey: 'accompanyQuota',
      header: sortableHeader('Accompany Quota'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.accompanyQuota}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Welcome Message',
      cell: ({ row }) => {
        const plainText = stripHtml(row.original.description)

        return (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">
              {plainText
                ? plainText.length > 60
                  ? plainText.slice(0, 60) + '…'
                  : plainText
                : '—'}
            </span>

            {plainText && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-[#3AC1F6]"
                onClick={() =>
                  setViewDescription(row.original.description || '')
                }
              >
                View Details
              </Button>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-[#3AC1F6] hover:bg-[#1FAEE8]">
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Guest?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.name}
                  </span>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDelete(row.original._id)}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  /* ================= UI STATES ================= */

  if (isLoading) return <EntitySkeleton title="Guests" />

  /* ================= UI ================= */

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#3AC1F6]">All Guests</h1>
        <Button
          onClick={handleAdd}
          className="font-semibold bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white"
        >
          + Add Guest
        </Button>
      </div>

      {/* Table */}
      <DataTable data={guests} columns={columns} />

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[620px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingGuest ? 'Edit Guest' : 'Add Guest'}
            </h2>
          </div>

          <AddGuestForm
            defaultValues={editingGuest || undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>

      {/* View Description Dialog */}
      <AlertDialog
        open={!!viewDescription}
        onOpenChange={() => setViewDescription(null)}
      >
        <AlertDialogContent
          className="
            max-w-3xl
            max-h-[80vh]
            overflow-y-auto
            overflow-x-hidden
          "
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome Message</AlertDialogTitle>
            <AlertDialogDescription>
            Welcome Message sent to this guest.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div
            className="
              prose prose-sm max-w-none mt-4
              break-words
              overflow-hidden
              [&_*]:break-words
              [&_*]:whitespace-normal
            "
            dangerouslySetInnerHTML={{
              __html: viewDescription || '',
            }}
          />

          <AlertDialogFooter>
        
                <AlertDialogCancel>Close</AlertDialogCancel>
        
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ================= SORTABLE HEADER ================= */

function sortableHeader(label: string) {
  const Header = ({ column }: { column: any }) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {label}
        {sorted === 'asc' && <ArrowUp className="h-4 w-4 ml-2" />}
        {sorted === 'desc' && <ArrowDown className="h-4 w-4 ml-2" />}
        {!sorted && <ArrowUpDown className="h-4 w-4 ml-2" />}
      </Button>
    )
  }

  Header.displayName = `SortableHeader(${label})`
  return Header
}
