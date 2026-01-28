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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import AddGuestForm from '@/components/AddGuestForm'
import { DataTable } from '@/components/DataTable'
import { GuestFormValues } from '@/validations/guestSchema'
import EntitySkeleton from '@/components/EntitySkeleton'

import { fetcher } from '@/lib/fetcher'
import { apiRequest } from '@/lib/apiRequest'

/* ================= HELPERS ================= */

const stripHtml = (html?: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

const exportCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) return

  const headers = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).join(',')).join('\n')
  const csv = `${headers}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ================= TYPES ================= */

type GuestRow = GuestFormValues & {
  _id: string
  regNum: string
  invitationStatus: string
}

type AccompanyRow = {
  id: string

  primaryName: string
  primaryRegNum: string
  primaryEmail: string
  primaryMobile: string

  accompanyName: string
  accompanyRegNum: string
  accompanyEmail: string
  accompanyMobile: string
}

type AccompanyGroup = {
  _id: string
  guestId: {
    _id: string
    name: string
    email: string
    mobile: string
    regNum: string
    accompanyQuota: number
    invitationStatus: string
  }
  accompanies: {
    _id: string
    name: string
    email: string
    mobile: string
    accompanyRegNum: string
  }[]
}

/* ================= COMPONENT ================= */

export default function GuestClient() {
  const [activeTab, setActiveTab] =
    useState<'guests' | 'accompanies'>('guests')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null)
  const [viewDescription, setViewDescription] = useState<string | null>(null)

  /* ========== PRIMARY GUESTS ========== */

  const {
    data: guestData,
    isLoading: guestLoading,
    mutate: mutateGuests,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/guests`,
    fetcher
  )

  const guests: GuestRow[] = useMemo(() => guestData ?? [], [guestData])

  /* ========== ACCOMPANIES ========== */

  const {
    data: accompanyData,
    isLoading: accompanyLoading,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/accompanies`,
    fetcher
  )

  const accompanyGroups: AccompanyGroup[] =
    accompanyData?.accompanies ?? []

  const accompanyRows: AccompanyRow[] = useMemo(() => {
    if (!accompanyGroups.length) return []

    return accompanyGroups.flatMap(group =>
      group.accompanies.map(acc => ({
        id: acc._id,

        primaryName: group.guestId.name,
        primaryRegNum: group.guestId.regNum,
        primaryEmail: group.guestId.email,
        primaryMobile: group.guestId.mobile,

        accompanyName: acc.name,
        accompanyRegNum: acc.accompanyRegNum,
        accompanyEmail: acc.email,
        accompanyMobile: acc.mobile,
      }))
    )
  }, [accompanyGroups])

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
    await mutateGuests()
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
      await mutateGuests()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ================= EXPORT ================= */

  const handleExport = () => {
    if (activeTab === 'guests') {
      exportCSV(
        'primary-guests.csv',
        guests.map(g => ({
          Name: g.name,
          Email: g.email,
          Mobile: g.mobile,
          RegNo: g.regNum,
          Quota: g.accompanyQuota,
          Status: g.invitationStatus,
        }))
      )
    } else {
      exportCSV(
        'accompanies.csv',
        accompanyRows.map(a => ({
          PrimaryGuest: a.primaryName,
          PrimaryRegNo: a.primaryRegNum,
          AccompanyName: a.accompanyName,
          AccompanyRegNo: a.accompanyRegNum,
          Email: a.accompanyEmail,
          Mobile: a.accompanyMobile,
        }))
      )
    }
  }

  /* ================= PRIMARY GUEST COLUMNS ================= */

  const guestColumns: ColumnDef<GuestRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
    },
    { accessorKey: 'regNum', header: sortableHeader('Reg. No.') },
    { accessorKey: 'name', header: sortableHeader('Name') },
    { accessorKey: 'email', header: sortableHeader('Email') },
    { accessorKey: 'mobile', header: sortableHeader('Mobile') },
    {
      accessorKey: 'accompanyQuota',
      header: sortableHeader('Quota'),
    },
    {
      accessorKey: 'description',
      header: 'Welcome Message',
      cell: ({ row }) => {
        const text = stripHtml(row.original.description)
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {text ? text.slice(0, 60) + '…' : '—'}
            </span>
            {text && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
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
              <Button size="sm" className="bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white">
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Guest?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <b>{row.original.name}</b>.
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

  /* ================= ACCOMPANY COLUMNS ================= */

  const accompanyColumns: ColumnDef<AccompanyRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
    },
    {
      header: 'Primary Guest',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.primaryName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.primaryRegNum}
          </div>
        </div>
      ),
    },
    {
      header: 'Primary Contact',
      cell: ({ row }) => (
        <div>
          <div>{row.original.primaryEmail}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.primaryMobile}
          </div>
        </div>
      ),
    },
    { accessorKey: 'accompanyName', header: 'Accompany Name' },
    { accessorKey: 'accompanyRegNum', header: 'Accompany Reg. No.' },
    { accessorKey: 'accompanyEmail', header: 'Email' },
    { accessorKey: 'accompanyMobile', header: 'Mobile' },
  ]

  if (guestLoading) return <EntitySkeleton title="Guests" />

  return (
    <div className="bg-background text-foreground">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#3AC1F6]">
          Guest Management
        </h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>

          {activeTab === 'guests' && (
            <Button
              onClick={handleAdd}
              className="bg-[#3AC1F6] hover:bg-[#1FAEE8] text-white"
            >
              + Add Guest
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="guests">Primary Guests</TabsTrigger>
          <TabsTrigger value="accompanies">Accompanies</TabsTrigger>
        </TabsList>

        <TabsContent value="guests">
          <DataTable data={guests} columns={guestColumns} />
        </TabsContent>

        <TabsContent value="accompanies">
          {accompanyLoading ? (
            <EntitySkeleton title="Accompanies" />
          ) : (
            <DataTable data={accompanyRows} columns={accompanyColumns} />
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[620px]">
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
