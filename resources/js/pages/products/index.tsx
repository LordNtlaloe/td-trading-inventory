"use client"

import * as React from "react"
import { Head, Link, usePage, router } from "@inertiajs/react"
import { type BreadcrumbItem } from "@/types"
import AppLayout from "@/layouts/app-layout"
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
import { ChevronDown, MoreHorizontal, PenIcon, Trash2Icon } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProductsLayout from "@/layouts/products/layout"

const breadcrumbs: BreadcrumbItem[] = [{ title: "Products", href: "/products" }]

type Product = {
    id: number
    product_name: string
    product_price: number
    product_quantity: number
    product_category: string
    product_commodity: string
    product_grade: string
    branch: {
        id: number
        branch_name: string
        branch_location: string
    }
}

export default function ProductsIndex() {
    const { products, branches, user_role, current_branch } = usePage<{
        products: Product[]
        branches: { id: number; branch_name: string }[]
        user_role: string
        current_branch: number | null
    }>().props

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [selectedBranch, setSelectedBranch] = React.useState<string>(
        current_branch ? current_branch.toString() : "all"
    )

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: "id",
            header: "ID",
        },
        {
            accessorKey: "product_name",
            header: "Product Name",
        },
        {
            accessorKey: "product_price",
            header: "Price",
            cell: ({ row }) => `$${row.original.product_price.toFixed(2)}`,
        },
        {
            accessorKey: "product_quantity",
            header: "Quantity",
        },
        {
            accessorKey: "product_category",
            header: "Category",
        },
        {
            accessorKey: "branch.branch_name",
            header: "Branch",
            cell: ({ row }) => row.original.branch.branch_name,
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
                            <Link href={`/products/${row.original.id}/edit`}>
                                <PenIcon className="h-4 w-4 mr-2" /> Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.delete(`/products/${row.original.id}`)}
                            className="text-red-600"
                        >
                            <Trash2Icon className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const table = useReactTable({
        data: products,
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
        router.get('/products', { branch_id: branchId }, { preserveState: true })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <ProductsLayout>

                <h1 className="text-2xl font-bold pb-2">Products</h1>

                <div className="flex justify-between gap-4 pb-4">
                    <Input
                        className="w-64"
                        placeholder="Search products..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />

                    {user_role === 'admin' && (
                        <Select
                            value={selectedBranch}
                            onValueChange={handleBranchChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by branch" />
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
                        <div className="flex gap-2">
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <Link href="/products/create">
                                <Button>Add New Product</Button>
                            </Link>
                        </div>

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

                <div className="rounded-md border py-2">
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
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing {table.getFilteredRowModel().rows.length} of{' '}
                        {products.length} products
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
            </ProductsLayout>
        </AppLayout>
    )
}