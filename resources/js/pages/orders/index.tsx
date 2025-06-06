"use client"

import * as React from "react"
import { Head, Link, usePage, router } from "@inertiajs/react"
import { type BreadcrumbItem } from "@/types"
import AppLayout from "@/layouts/app-layout"
import OrdersLayout from "@/layouts/orders/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    ColumnDef,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, MoreHorizontal, EyeIcon } from "lucide-react"
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const breadcrumbs: BreadcrumbItem[] = [{ title: "Orders", href: "/orders" }]

type Order = {
    id: number
    total_amount: number
    status: string
    order_date: string
    items_count: number
    branch: {
        branch_name: string
    }
    cashier: {
        id: number
        name: string
    }
}
export default function OrdersIndex() {
    const { orders, user_role, branches, current_branch } = usePage<{ 
        orders: Order[]
        user_role: string
        branches: { id: number; branch_name: string }[]
        current_branch: number | null
        auth: {
            user: {
                id: number
                name: string
            }
        }
    }>().props
    
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [selectedBranch, setSelectedBranch] = React.useState<string>(
        current_branch ? current_branch.toString() : "all"
    )

    // Helper function to get branch name from ID
    const getBranchName = (branchId: string): string => {
        if (branchId === "all") return "All Branches";
        const branch = branches.find(b => b.id.toString() === branchId);
        return branch ? branch.branch_name : "Select Branch";
    };

    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "id",
            header: "Order #",
            cell: ({ row }) => `#${row.original.id}`,
        },
        {
            accessorKey: "order_date",
            header: "Date",
            cell: ({ row }) => format(new Date(row.original.order_date), 'MMM dd, yyyy HH:mm'),
        },
        // Only show branch column for admins
        ...(user_role === 'Admin' ? [{
            accessorKey: "branch.branch_name",
            header: "Branch",
            cell: ({ row }) => row.original.branch.branch_name,
        }] : []),
        {
            accessorKey: "Cashier",
            header: "Cashier",
            cell: ({ row }) => row.original.cashier.name,
            accessorFn: (row) => row.cashier.id
        },
        {
            accessorKey: "items_count",
            header: "Items",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.items_count} items
                </Badge>
            ),
        },
        {
            accessorKey: "total_amount",
            header: "Total",
            cell: ({ row }) => `M${row.original.total_amount.toFixed(2)}`,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.status === 'completed' ? 'default' :
                            row.original.status === 'pending' ? 'secondary' :
                                'destructive'
                    }
                    className={row.original.status === 'completed' ? 'bg-green-400 text-green-800' :
                            row.original.status === 'pending' ? 'bg-yellow-400 text-yellow-600' :
                            'bg-red-400 text-red-700'
                    }
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/orders/${row.original.id}`}>
                                <EyeIcon className="h-4 w-4 mr-2" /> View
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const table = useReactTable({
        data: orders || [],
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnVisibility,
            globalFilter,
        },
    })

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId)
        router.get('/orders', { branch_id: branchId }, { preserveState: true })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales/Orders" />
            <OrdersLayout>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Input
                            className="w-64"
                            placeholder="Search orders..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                        
                        <div className="flex items-center gap-2">
                            {user_role === 'Admin' && (
                                <Select
                                    value={selectedBranch}
                                    onValueChange={handleBranchChange}
                                >
                                    <SelectTrigger className="w-[250px]">
                                        <SelectValue>
                                            {getBranchName(selectedBranch)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.branch_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table.getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing {table.getFilteredRowModel().rows.length} of{' '}
                            {orders?.length || 0} orders
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </OrdersLayout>
        </AppLayout>
    )
}